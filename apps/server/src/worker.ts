import prisma from "./config/prisma";
import redis from "./config/redis";
import { initializeEmailService } from "./integrations/emailService";
import messageTriggerJob, { MESSAGE_TRIGGER_CRON } from "./jobs/messageTriggerJob";
import pushReminderJob, { PUSH_REMINDER_CRON } from "./jobs/pushReminderJob";
import { messageDeliveryQueue } from "./queues/messageDeliveryQueue";
import { logger } from "./utils/loggers";
import { startMessageDeliveryWorker } from "./workers/messageDeliveryWorker";

const startWorker = async () => {
  try {
    logger.info("Initializing Last Words Background Worker Service...");

    // Initialize email transport for background mail delivery
    await initializeEmailService();

    // 1. Start BullMQ Queue Workers
    const workerConcurrency = process.env.WORKER_CONCURRENCY
      ? parseInt(process.env.WORKER_CONCURRENCY, 10)
      : 5;
    const worker = startMessageDeliveryWorker(workerConcurrency);
    logger.info(`BullMQ message delivery worker active with concurrency: ${workerConcurrency}`);

    // 2. Start Cron Schedules
    messageTriggerJob.start();
    logger.info(`Message trigger cron active (${MESSAGE_TRIGGER_CRON})`);

    pushReminderJob.start();
    logger.info(`Push reminder cron active (${PUSH_REMINDER_CRON})`);

    logger.info("Background Worker Service successfully started and ready for queue jobs.");

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down worker gracefully...`);
      try {
        messageTriggerJob.stop();
        pushReminderJob.stop();
        await worker.close();
        await messageDeliveryQueue.close();
        await prisma.$disconnect();
        redis.disconnect();
        logger.info("Worker, queues, cron jobs, and database connections cleanly closed.");
        process.exit(0);
      } catch (err) {
        logger.error("Error during graceful worker shutdown:", err);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error("Worker startup failed:", err);
    process.exit(1);
  }
};

startWorker();

