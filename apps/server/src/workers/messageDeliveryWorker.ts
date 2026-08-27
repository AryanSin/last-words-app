import { DeliveryChannel, MessageStatus } from "@prisma/client";
import { Job, Worker } from "bullmq";
import { MAX_MAIL_RETRIES } from "../config/constants";
import prisma from "../config/prisma";
import { redisConnectionOptions } from "../config/redis";
import { sendEmail } from "../integrations/emailService";
import { whatsappService } from "../integrations/whatsappService";
import {
  MESSAGE_DELIVERY_QUEUE_NAME,
  MessageDeliveryJobData,
} from "../queues/messageDeliveryQueue";
import { decryptMessage, decryptMessageNullable } from "../utils/crypto";
import { logger, messageJobLogger } from "../utils/loggers";

export const processDeliveryJob = async (
  job: Job<MessageDeliveryJobData>,
) => {
  const { messageId } = job.data;
  messageJobLogger(`[Worker] Processing delivery job ${job.id} for message ID ${messageId}`);

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
  });

  if (!message) {
    logger.warn(`[Worker] Message with ID ${messageId} not found. Skipping job.`);
    return { skipped: true, reason: "Message not found" };
  }

  if (message.status === MessageStatus.SENT) {
    messageJobLogger(`[Worker] Message ${messageId} already marked as SENT. Skipping.`);
    return { skipped: true, reason: "Already sent" };
  }

  let plainContent = message.content;
  let plainTitle = message.title;
  try {
    plainContent = decryptMessage(message.content);
    plainTitle = decryptMessageNullable(message.title);
  } catch (err: any) {
    logger.error(`[Worker] Decryption failed for message ${messageId}:`, err);
    throw new Error(`Message decryption failed: ${err?.message || err}`);
  }

  const channel = message.deliveryChannel;
  const targetEmail = message.recipientEmail || message.user.email;
  const targetPhone = message.recipientPhone || message.user.phoneNumber;

  const events: {
    channel: DeliveryChannel;
    recipient: string;
    success: boolean;
    error?: string | null;
  }[] = [];

  let emailSuccess = false;
  let whatsAppSuccess = false;
  const errors: string[] = [];

  if (channel === DeliveryChannel.EMAIL || channel === DeliveryChannel.BOTH) {
    if (targetEmail) {
      try {
        const subject =
          plainTitle || `Message from ${message.user.name || "Last Words"}`;
        await sendEmail(
          targetEmail,
          subject,
          plainContent,
          message.user.name,
          message.recipientName,
        );
        events.push({
          channel: DeliveryChannel.EMAIL,
          recipient: targetEmail,
          success: true,
        });
        emailSuccess = true;
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        errors.push(`Email: ${errorMsg}`);
        events.push({
          channel: DeliveryChannel.EMAIL,
          recipient: targetEmail,
          success: false,
          error: errorMsg.slice(0, 500),
        });
      }
    } else {
      errors.push("Email channel selected but no recipient email configured");
      events.push({
        channel: DeliveryChannel.EMAIL,
        recipient: "unknown",
        success: false,
        error: "Missing recipient email address",
      });
    }
  }

  if (channel === DeliveryChannel.WHATSAPP || channel === DeliveryChannel.BOTH) {
    if (targetPhone) {
      try {
        const waResult = await whatsappService.sendMessage(
          targetPhone,
          plainContent,
          plainTitle || undefined,
        );

        if (waResult.success) {
          events.push({
            channel: DeliveryChannel.WHATSAPP,
            recipient: targetPhone,
            success: true,
          });
          whatsAppSuccess = true;
        } else {
          const errorMsg = waResult.error || "WhatsApp delivery failed";
          errors.push(`WhatsApp: ${errorMsg}`);
          events.push({
            channel: DeliveryChannel.WHATSAPP,
            recipient: targetPhone,
            success: false,
            error: errorMsg.slice(0, 500),
          });
        }
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        errors.push(`WhatsApp: ${errorMsg}`);
        events.push({
          channel: DeliveryChannel.WHATSAPP,
          recipient: targetPhone,
          success: false,
          error: errorMsg.slice(0, 500),
        });
      }
    } else {
      errors.push("WhatsApp channel selected but no recipient phone configured");
      events.push({
        channel: DeliveryChannel.WHATSAPP,
        recipient: "unknown",
        success: false,
        error: "Missing recipient phone number",
      });
    }
  }

  // Persist delivery events to database
  if (events.length > 0) {
    await prisma.deliveryEvent.createMany({
      data: events.map((ev) => ({
        messageId: message.id,
        channel: ev.channel,
        recipient: ev.recipient,
        success: ev.success,
        error: ev.error ?? null,
      })),
    });
  }

  // Update aggregated system metrics
  const emailSuccessInc = events.filter(
    (e) => e.channel === DeliveryChannel.EMAIL && e.success,
  ).length;
  const emailFailInc = events.filter(
    (e) => e.channel === DeliveryChannel.EMAIL && !e.success,
  ).length;
  const waSuccessInc = events.filter(
    (e) => e.channel === DeliveryChannel.WHATSAPP && e.success,
  ).length;
  const waFailInc = events.filter(
    (e) => e.channel === DeliveryChannel.WHATSAPP && !e.success,
  ).length;

  await prisma.systemMetric.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      totalEmailsSent: emailSuccessInc,
      totalEmailFailures: emailFailInc,
      totalWhatsAppSent: waSuccessInc,
      totalWhatsAppFail: waFailInc,
    },
    update: {
      totalEmailsSent: { increment: emailSuccessInc },
      totalEmailFailures: { increment: emailFailInc },
      totalWhatsAppSent: { increment: waSuccessInc },
      totalWhatsAppFail: { increment: waFailInc },
    },
  });

  // Evaluate overall delivery success based on required channel
  const isOverallSuccess =
    (channel === DeliveryChannel.EMAIL && emailSuccess) ||
    (channel === DeliveryChannel.WHATSAPP && whatsAppSuccess) ||
    (channel === DeliveryChannel.BOTH && (emailSuccess || whatsAppSuccess));

  if (isOverallSuccess) {
    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: MessageStatus.SENT,
        sentAt: new Date(),
        lastError: null,
      },
    });
    messageJobLogger(`[Worker] Successfully delivered message ${message.id}`);
    return { success: true, messageId: message.id, events };
  } else {
    const combinedError = errors.join("; ");
    const newFailedAttempts = message.failedAttempts + 1;
    const shouldMarkFailed = newFailedAttempts >= MAX_MAIL_RETRIES;

    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: shouldMarkFailed ? MessageStatus.FAILED : message.status,
        failedAttempts: { increment: 1 },
        lastError: combinedError.slice(0, 500),
      },
    });

    messageJobLogger(
      `[Worker] Delivery failed for message ${message.id} (Attempt ${newFailedAttempts}): ${combinedError}`,
    );

    throw new Error(combinedError);
  }
};

export const createMessageDeliveryWorker = (concurrency = 5) => {
  const worker = new Worker<MessageDeliveryJobData>(
    MESSAGE_DELIVERY_QUEUE_NAME,
    async (job) => processDeliveryJob(job),
    {
      connection: redisConnectionOptions,
      concurrency,
    },
  );

  worker.on("completed", (job) => {
    logger.info(`[BullMQ Worker] Job ${job.id} (messageId: ${job.data.messageId}) completed.`);
  });

  worker.on("failed", (job, err) => {
    logger.error(
      `[BullMQ Worker] Job ${job?.id} (messageId: ${job?.data?.messageId}) failed: ${err.message}`,
    );
  });

  worker.on("error", (err) => {
    logger.error("[BullMQ Worker] Worker error:", err);
  });

  return worker;
};

export const messageDeliveryWorker = createMessageDeliveryWorker();
