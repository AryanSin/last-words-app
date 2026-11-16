"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUSH_REMINDER_CRON = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const pushReminderService_1 = require("../services/pushReminderService");
const loggers_1 = require("../utils/loggers");
let isRunning = false;
// Default: Runs daily at 09:00 AM server time (configurable via env)
exports.PUSH_REMINDER_CRON = process.env.PUSH_REMINDER_CRON || "0 0 * * *";
const pushReminderJob = node_cron_1.default.schedule(exports.PUSH_REMINDER_CRON, async () => {
    if (isRunning)
        return;
    isRunning = true;
    try {
        loggers_1.logger.info("[Cron] Running scheduled push notification reminders...");
        const summary = await (0, pushReminderService_1.runPushReminderService)();
        loggers_1.logger.info(`[Cron] Push reminders completed. Sent ${summary.notificationsSent} notifications (${summary.inactivityWarningsCount} warnings, ${summary.heartbeatRemindersCount} heartbeat reminders).`);
    }
    catch (err) {
        loggers_1.logger.error("[Cron] Push reminder cron job failed:", err);
    }
    finally {
        isRunning = false;
    }
});
exports.default = pushReminderJob;
