import { DeliveryChannel, MessageStatus, Prisma } from "@prisma/client";
import { MAX_MAIL_RETRIES } from "../config/constants";
import prisma from "../config/prisma";
import { shouldTriggerMessage } from "../helpers/messageTriggerHelpers";
import { sendMessages } from "../processors/messageSender";
import { logger } from "../utils/loggers";

export const runMessageTriggerService = async () => {
  const startDate = new Date();
  let cronJobExecution: Prisma.JobExecutionCreateInput = {
    startedAt: startDate,
    jobName: "messageTriggerService",
    status: "RUNNING",
  };

  try {
    const messageList = await prisma.message.findMany({
      where: {
        status: {
          not: MessageStatus.SENT,
        },
        failedAttempts: {
          lt: MAX_MAIL_RETRIES,
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        recipientName: true,
        recipientEmail: true,
        recipientPhone: true,
        deliveryChannel: true,
        triggerAfterDays: true,
        failedAttempts: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            lastLoginAt: true,
            defaultTriggerAfterDays: true,
          },
        },
      },
    });

    const messagesToSend = messageList.filter((message) =>
      shouldTriggerMessage(message, message.user),
    );

    const { successfullySentMessages, failedMessages, allEvents } =
      await sendMessages(messagesToSend);

    cronJobExecution = {
      ...cronJobExecution,
      successCount: successfullySentMessages.length,
      failureCount: failedMessages.length,
      status: "FINISHED SENDING",
    };

    if (successfullySentMessages.length > 0) {
      await prisma.message.updateMany({
        where: {
          id: {
            in: successfullySentMessages,
          },
        },
        data: {
          status: MessageStatus.SENT,
          sentAt: new Date(),
        },
      });
    }

    if (failedMessages.length > 0) {
      await prisma.$transaction(
        failedMessages.map((msg) =>
          prisma.message.update({
            where: {
              id: msg.id,
            },
            data: {
              status: MessageStatus.FAILED,
              lastError: String(msg.error).slice(0, 500),
              failedAttempts: { increment: 1 },
            },
          }),
        ),
      );
    }

    // Persist all delivery events
    if (allEvents.length > 0) {
      await prisma.deliveryEvent.createMany({
        data: allEvents.map((ev) => ({
          messageId: ev.messageId,
          channel: ev.channel,
          recipient: ev.recipient,
          success: ev.success,
          error: ev.error ? String(ev.error).slice(0, 500) : null,
        })),
      });
    }

    // Update system metrics counters
    const emailSuccessCount = allEvents.filter(
      (e) => e.channel === DeliveryChannel.EMAIL && e.success,
    ).length;
    const emailFailCount = allEvents.filter(
      (e) => e.channel === DeliveryChannel.EMAIL && !e.success,
    ).length;
    const waSuccessCount = allEvents.filter(
      (e) => e.channel === DeliveryChannel.WHATSAPP && e.success,
    ).length;
    const waFailCount = allEvents.filter(
      (e) => e.channel === DeliveryChannel.WHATSAPP && !e.success,
    ).length;

    await prisma.systemMetric.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        totalEmailsSent: emailSuccessCount,
        totalEmailFailures: emailFailCount,
        totalWhatsAppSent: waSuccessCount,
        totalWhatsAppFail: waFailCount,
      },
      update: {
        totalEmailsSent: { increment: emailSuccessCount },
        totalEmailFailures: { increment: emailFailCount },
        totalWhatsAppSent: { increment: waSuccessCount },
        totalWhatsAppFail: { increment: waFailCount },
      },
    });

    cronJobExecution = {
      ...cronJobExecution,
      completedAt: new Date(),
      status: "COMPLETED",
    };
  } catch (err: any) {
    logger.error("Message trigger service failed:", err);
    cronJobExecution = {
      ...cronJobExecution,
      completedAt: new Date(),
      status: `FAILED: ${String(err?.message || err).slice(0, 200)}`,
    };
  }

  await prisma.jobExecution.create({
    data: cronJobExecution,
  });
};
