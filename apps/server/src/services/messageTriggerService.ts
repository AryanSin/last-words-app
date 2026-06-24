import { MessageStatus, Prisma } from "@prisma/client";
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
        content: true,
        triggerAfterDays: true,
        failedAttempts: true,
        user: {
          select: {
            id: true,
            email: true,
            lastLoginAt: true,
            defaultTriggerAfterDays: true,
          },
        },
      },
    });

    const messagesToSend = messageList.filter((message) =>
      shouldTriggerMessage(message, message.user),
    );

    const { successfullySentMessages, failedMessages } =
      await sendMessages(messagesToSend);

    cronJobExecution = {
      ...cronJobExecution,
      successCount: successfullySentMessages.length,
      failureCount: failedMessages.length,
      status: "FINISHED SENDING",
    };

    const updateSentMessages = await prisma.message.updateMany({
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

    const updateFailedMessages = await prisma.$transaction(
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

    cronJobExecution = {
      ...cronJobExecution,
      status: "UPDATED MESSAGE STATUS",
    };

    await prisma.emailDeliveryEvent.createMany({
      data: successfullySentMessages.map((id) => ({
        messageId: id,
        success: true,
      })),
    });

    await prisma.emailDeliveryEvent.createMany({
      data: failedMessages.map((msg) => ({
        messageId: msg.id,
        success: false,
        error: String(msg.error).slice(0, 500),
      })),
    });

    cronJobExecution = {
      ...cronJobExecution,
      status: "CREATED EMAIL DELIVERY EVENT",
    };

    await prisma.systemMetric.update({
      where: {
        id: 1,
      },
      data: {
        totalEmailsSent: {
          increment: successfullySentMessages.length,
        },
        totalEmailFailures: {
          increment: failedMessages.length,
        },
      },
    });

    cronJobExecution = {
      ...cronJobExecution,
      status: "FINISHED JOB",
    };
  } catch (err) {
    logger.error("Message trigger service failed:", err);
  }

  await prisma.jobExecution.create({
    data: cronJobExecution,
  });
};
