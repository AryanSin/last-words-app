import app from "./app";
import { PORT } from "./config/env";
import prisma from "./config/prisma";
import redis from "./config/redis";
import { initializeEmailService } from "./integrations/emailService";
import messageTriggerJob, { MESSAGE_TRIGGER_CRON } from "./jobs/messageTriggerJob";
import pushReminderJob, { PUSH_REMINDER_CRON } from "./jobs/pushReminderJob";
import { messageDeliveryQueue } from "./queues/messageDeliveryQueue";
import { logger } from "./utils/loggers";
import { startMessageDeliveryWorker } from "./workers/messageDeliveryWorker";

const startCombined = async () => {
  try {
    logger.info("Starting Last Words in Combined Mode (API + Worker)...");

    // 1. Initialize Email Service
    await initializeEmailService();

    // 2. Start BullMQ Queue Workers
    const workerConcurrency = process.env.WORKER_CONCURRENCY
      ? parseInt(process.env.WORKER_CONCURRENCY, 10)
      : 5;
    const worker = startMessageDeliveryWorker(workerConcurrency);
    logger.info(`BullMQ message delivery worker active with concurrency: ${workerConcurrency}`);

    // 3. Start Background Cron Schedules
    messageTriggerJob.start();
    logger.info(`Message trigger cron active (${MESSAGE_TRIGGER_CRON})`);

    pushReminderJob.start();
    logger.info(`Push reminder cron active (${PUSH_REMINDER_CRON})`);

    // 4. Start HTTP API Server
    const server = app.listen(PORT, () => {
      logger.info(`Last Words API server running on port ${PORT}`);
      logger.info(`Interactive API Docs available at http://localhost:${PORT}/docs`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down combined service gracefully...`);
      try {
        messageTriggerJob.stop();
        pushReminderJob.stop();
        server.close();
        await worker.close();
        await messageDeliveryQueue.close();
        await prisma.$disconnect();
        redis.disconnect();
        logger.info("All services, queues, and database connections cleanly closed.");
        process.exit(0);
      } catch (err) {
        logger.error("Error during graceful shutdown:", err);
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error("Combined service startup failed:", err);
    process.exit(1);
  }
};

startCombined();
