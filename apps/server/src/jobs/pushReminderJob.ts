import cron from "node-cron";
import { runPushReminderService } from "../services/pushReminderService";
import { logger } from "../utils/loggers";

let isRunning = false;

// Default: Runs daily at 09:00 AM server time (configurable via env)
export const PUSH_REMINDER_CRON = process.env.PUSH_REMINDER_CRON || "0 0 * * *";

const pushReminderJob = cron.schedule(
  PUSH_REMINDER_CRON,
  async () => {
    if (isRunning) return;

    isRunning = true;
    try {
      logger.info("[Cron] Running scheduled push notification reminders...");
      const summary = await runPushReminderService();
      logger.info(
        `[Cron] Push reminders completed. Sent ${summary.notificationsSent} notifications (${summary.inactivityWarningsCount} warnings, ${summary.heartbeatRemindersCount} heartbeat reminders).`,
      );
    } catch (err) {
      logger.error("[Cron] Push reminder cron job failed:", err);
    } finally {
      isRunning = false;
    }
  },
);

export default pushReminderJob;
