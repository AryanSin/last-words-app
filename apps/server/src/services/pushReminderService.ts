import { MessageStatus, Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { logger, messageJobLogger } from "../utils/loggers";
import pushNotificationService from "./pushNotificationService";

export interface PushReminderSummary {
  totalUsersChecked: number;
  notificationsSent: number;
  inactivityWarningsCount: number;
  heartbeatRemindersCount: number;
}

/**
 * Executes the push notification reminder engine.
 * Sends warnings to users whose messages will be triggered within the week if they do not open the app.
 */
export const runPushReminderService = async (): Promise<PushReminderSummary> => {
  const startDate = new Date();
  let cronJobExecution: Prisma.JobExecutionCreateInput = {
    startedAt: startDate,
    jobName: "pushReminderService",
    status: "RUNNING",
  };

  const summary: PushReminderSummary = {
    totalUsersChecked: 0,
    notificationsSent: 0,
    inactivityWarningsCount: 0,
    heartbeatRemindersCount: 0,
  };

  try {
    const usersWithDevices = await prisma.user.findMany({
      where: {
        archived: false,
        deviceTokens: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        lastLoginAt: true,
        lastReminderSentAt: true,
        defaultTriggerAfterDays: true,
        deviceTokens: {
          select: { token: true },
        },
        messages: {
          where: {
            status: MessageStatus.PENDING,
          },
          select: {
            id: true,
            title: true,
            triggerAfterDays: true,
          },
        },
      },
    });

    summary.totalUsersChecked = usersWithDevices.length;
    const now = Date.now();

    for (const user of usersWithDevices) {
      const tokens = user.deviceTokens.map((d) => d.token).filter(Boolean);
      if (tokens.length === 0) continue;

      const lastLogin = new Date(user.lastLoginAt).getTime();
      const daysPassed = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));

      const pendingMessages = user.messages;
      let minDaysRemaining = Infinity;

      for (const msg of pendingMessages) {
        const threshold = msg.triggerAfterDays ?? user.defaultTriggerAfterDays ?? 365;
        const remaining = threshold - daysPassed;
        if (remaining < minDaysRemaining) {
          minDaysRemaining = remaining;
        }
      }

      let shouldSendNotification = false;
      let notificationPayload: { title: string; body: string; data: Record<string, any> } | null = null;

      if (pendingMessages.length > 0 && minDaysRemaining <= 7 && minDaysRemaining >= 0) {
        shouldSendNotification = true;
        summary.inactivityWarningsCount++;

        const daysText = minDaysRemaining === 0 ? "today" : `in ${minDaysRemaining} day(s)`;
        notificationPayload = {
          title: "Inactivity Alert: Vault Message Pending",
          body: `You have ${pendingMessages.length} message(s) scheduled to be sent ${daysText} if you do not open the app. Tap to confirm you are safe.`,
          data: {
            type: "INACTIVITY_WARNING",
            daysRemaining: minDaysRemaining,
            messageCount: pendingMessages.length,
          },
        };
      } else if (daysPassed >= 5) {
        const lastReminderTime = user.lastReminderSentAt ? new Date(user.lastReminderSentAt).getTime() : 0;
        const daysSinceLastReminder = Math.floor((now - lastReminderTime) / (1000 * 60 * 60 * 24));

        if (daysSinceLastReminder >= 2) {
          shouldSendNotification = true;
          summary.heartbeatRemindersCount++;

          notificationPayload = {
            title: "Last Words Check-In",
            body: "You haven't checked in recently. Open Last Words to keep your inactivity timer reset.",
            data: {
              type: "HEARTBEAT_REMINDER",
              daysInactive: daysPassed,
            },
          };
        }
      }

      if (shouldSendNotification && notificationPayload) {
        await pushNotificationService.sendPushNotification(tokens, notificationPayload);
        summary.notificationsSent += tokens.length;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastReminderSentAt: new Date() },
        });
      }
    }

    messageJobLogger(
      `[PushReminderService] Checked ${summary.totalUsersChecked} mobile users. Dispatched ${summary.notificationsSent} push notifications (${summary.inactivityWarningsCount} imminent dispatch warnings, ${summary.heartbeatRemindersCount} heartbeat reminders).`,
    );

    cronJobExecution = {
      ...cronJobExecution,
      successCount: summary.notificationsSent,
      failureCount: 0,
      completedAt: new Date(),
      status: "COMPLETED",
    };
  } catch (err: any) {
    logger.error("Push reminder service failed:", err);
    cronJobExecution = {
      ...cronJobExecution,
      completedAt: new Date(),
      status: `FAILED: ${String(err?.message || err).slice(0, 200)}`,
    };
  }

  await prisma.jobExecution.create({
    data: cronJobExecution,
  });

  return summary;
};

export default runPushReminderService;
