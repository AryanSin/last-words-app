"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_TRIGGER_CRON = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const messageTriggerService_1 = require("../services/messageTriggerService");
const loggers_1 = require("../utils/loggers");
let isRunning = false;
// Default: Runs daily at midnight (0 0 * * *)
exports.MESSAGE_TRIGGER_CRON = process.env.MESSAGE_TRIGGER_CRON || "0 * * * *";
const messageTriggerJob = node_cron_1.default.schedule(exports.MESSAGE_TRIGGER_CRON, async () => {
    if (isRunning)
        return;
    isRunning = true;
    try {
        loggers_1.logger.info("[Cron] Running scheduled message trigger check...");
        await (0, messageTriggerService_1.runMessageTriggerService)();
    }
    catch (err) {
        loggers_1.logger.error("[Cron] Message trigger cron job failed:", err);
    }
    finally {
        isRunning = false;
    }
});
exports.default = messageTriggerJob;
