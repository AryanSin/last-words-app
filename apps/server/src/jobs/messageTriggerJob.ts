import cron from "node-cron";
import { runMessageTriggerService } from "../services/messageTriggerService";
import { logger } from "../utils/loggers";

let isRunning = false;

// Default: Runs daily at midnight (0 0 * * *)
export const MESSAGE_TRIGGER_CRON = process.env.MESSAGE_TRIGGER_CRON || "0 0 * * *";

const messageTriggerJob = cron.schedule(
  MESSAGE_TRIGGER_CRON,
  async () => {
    if (isRunning) return;

    isRunning = true;
    try {
      logger.info("[Cron] Running scheduled message trigger check...");
      await runMessageTriggerService();
    } catch (err) {
      logger.error("[Cron] Message trigger cron job failed:", err);
    } finally {
      isRunning = false;
    }
  },
);

export default messageTriggerJob;
