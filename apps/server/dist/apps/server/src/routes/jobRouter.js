"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const messageSchemas_1 = require("@shared/schemas/messageSchemas");
const express_1 = __importDefault(require("express"));
const messageController_1 = require("../controllers/messageController");
const jobRateLimiter_1 = __importDefault(require("../middleware/rateLimiter/jobRateLimiter"));
const validate_1 = __importDefault(require("../middleware/validate"));
const messageTriggerService_1 = require("../services/messageTriggerService");
const pushReminderService_1 = require("../services/pushReminderService");
const catchAsync_1 = require("../utils/catchAsync");
const jobRouter = express_1.default.Router();
jobRouter.use(jobRateLimiter_1.default);
jobRouter.route("/trigger-message").post((0, catchAsync_1.catchAsync)(async (req, res, next) => {
    await (0, messageTriggerService_1.runMessageTriggerService)();
    return res.status(200).json({
        status: "success",
        data: "executed",
        requestedAt: res.requestTime,
    });
}));
jobRouter.route("/trigger-reminders").post((0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const summary = await (0, pushReminderService_1.runPushReminderService)();
    return res.status(200).json({
        status: "success",
        data: summary,
        requestedAt: res.requestTime,
    });
}));
jobRouter
    .route("/test-message")
    .post((0, validate_1.default)(messageSchemas_1.testMessageSchema), (0, catchAsync_1.catchAsync)(messageController_1.testMessageDeliveryController));
jobRouter
    .route("/test-send")
    .post((0, validate_1.default)(messageSchemas_1.testMessageSchema), (0, catchAsync_1.catchAsync)(messageController_1.testMessageDeliveryController));
jobRouter
    .route("/test-queue")
    .get((0, catchAsync_1.catchAsync)(messageController_1.getRecentQueuedMailJobsController));
jobRouter
    .route("/test-queue/:jobId")
    .get((0, catchAsync_1.catchAsync)(messageController_1.getQueuedMailJobStatusController));
exports.default = jobRouter;
