import app from "./app";
import { PORT } from "./config/env";
import { initializeEmailService } from "./integrations/emailService";
import messageTriggerJob, { MESSAGE_TRIGGER_CRON } from "./jobs/messageTriggerJob";
import pushReminderJob, { PUSH_REMINDER_CRON } from "./jobs/pushReminderJob";
import { messageDeliveryQueue } from "./queues/messageDeliveryQueue";
import { logger } from "./utils/loggers";
import { messageDeliveryWorker } from "./workers/messageDeliveryWorker";

const startServer = async () => {
  try {
    await initializeEmailService();

    messageTriggerJob.start();
    logger.info(`Message trigger cron started (${MESSAGE_TRIGGER_CRON})`);

    pushReminderJob.start();
    logger.info(`Push reminder cron started (${PUSH_REMINDER_CRON})`);

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info("HTTP server closed.");
        try {
          messageTriggerJob.stop();
          pushReminderJob.stop();
          await messageDeliveryWorker.close();
          await messageDeliveryQueue.close();
          logger.info("Background workers, queues, and cron jobs closed.");
          process.exit(0);
        } catch (err) {
          logger.error("Error during graceful shutdown:", err);
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error("Server startup failed:", err);
  }
};

startServer();
