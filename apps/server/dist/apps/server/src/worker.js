"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./config/prisma"));
const redis_1 = __importDefault(require("./config/redis"));
const emailService_1 = require("./integrations/emailService");
const messageTriggerJob_1 = __importStar(require("./jobs/messageTriggerJob"));
const pushReminderJob_1 = __importStar(require("./jobs/pushReminderJob"));
const messageDeliveryQueue_1 = require("./queues/messageDeliveryQueue");
const loggers_1 = require("./utils/loggers");
const messageDeliveryWorker_1 = require("./workers/messageDeliveryWorker");
const startWorker = async () => {
    try {
        loggers_1.logger.info("Initializing Last Words Background Worker Service...");
        // Initialize email transport for background mail delivery
        await (0, emailService_1.initializeEmailService)();
        // 1. Start BullMQ Queue Workers
        const workerConcurrency = process.env.WORKER_CONCURRENCY
            ? parseInt(process.env.WORKER_CONCURRENCY, 10)
            : 5;
        const worker = (0, messageDeliveryWorker_1.startMessageDeliveryWorker)(workerConcurrency);
        loggers_1.logger.info(`BullMQ message delivery worker active with concurrency: ${workerConcurrency}`);
        // 2. Start Cron Schedules
        messageTriggerJob_1.default.start();
        loggers_1.logger.info(`Message trigger cron active (${messageTriggerJob_1.MESSAGE_TRIGGER_CRON})`);
        pushReminderJob_1.default.start();
        loggers_1.logger.info(`Push reminder cron active (${pushReminderJob_1.PUSH_REMINDER_CRON})`);
        loggers_1.logger.info("Background Worker Service successfully started and ready for queue jobs.");
        // Graceful Shutdown
        const shutdown = async (signal) => {
            loggers_1.logger.info(`Received ${signal}. Shutting down worker gracefully...`);
            try {
                messageTriggerJob_1.default.stop();
                pushReminderJob_1.default.stop();
                await worker.close();
                await messageDeliveryQueue_1.messageDeliveryQueue.close();
                await prisma_1.default.$disconnect();
                redis_1.default.disconnect();
                loggers_1.logger.info("Worker, queues, cron jobs, and database connections cleanly closed.");
                process.exit(0);
            }
            catch (err) {
                loggers_1.logger.error("Error during graceful worker shutdown:", err);
                process.exit(1);
            }
        };
        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    }
    catch (err) {
        loggers_1.logger.error("Worker startup failed:", err);
        process.exit(1);
    }
};
startWorker();
