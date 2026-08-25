import { MessageStatus, Prisma } from "@prisma/client";
import { MAX_MAIL_RETRIES } from "../config/constants";
import prisma from "../config/prisma";
import { shouldTriggerMessage } from "../helpers/messageTriggerHelpers";
import { messageDeliveryQueue } from "../queues/messageDeliveryQueue";
import { logger, messageJobLogger } from "../utils/loggers";

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
        triggerAfterDays: true,
        user: {
          select: {
            id: true,
            lastLoginAt: true,
            defaultTriggerAfterDays: true,
          },
        },
      },
    });

    const messagesToTrigger = messageList.filter((message) =>
      shouldTriggerMessage(message, message.user),
    );

    messageJobLogger(
      `[TriggerService] Found ${messageList.length} pending candidate messages. Triggering ${messagesToTrigger.length} overdue messages.`,
    );

    if (messagesToTrigger.length > 0) {
      const jobs = messagesToTrigger.map((msg) => ({
        name: `send-message-${msg.id}`,
        data: { messageId: msg.id },
        opts: {
          jobId: `msg-${msg.id}-${Date.now()}`,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
        },
      }));

      await messageDeliveryQueue.addBulk(jobs);
      messageJobLogger(
        `[TriggerService] Successfully enqueued ${jobs.length} delivery jobs to BullMQ.`,
      );
    }

    cronJobExecution = {
      ...cronJobExecution,
      successCount: messagesToTrigger.length,
      failureCount: 0,
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

