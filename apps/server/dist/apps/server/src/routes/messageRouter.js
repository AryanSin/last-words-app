"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const messageSchemas_1 = require("@shared/schemas/messageSchemas");
const express_1 = __importDefault(require("express"));
const messageController_1 = require("../controllers/messageController");
const messageRateLimiter_1 = __importDefault(require("../middleware/rateLimiter/messageRateLimiter"));
const validate_1 = __importDefault(require("../middleware/validate"));
const catchAsync_1 = require("../utils/catchAsync");
const loggers_1 = require("../utils/loggers");
const messageRouter = express_1.default.Router();
messageRouter.use(messageRateLimiter_1.default);
messageRouter
    .route("/")
    .get((0, catchAsync_1.catchAsync)(messageController_1.getAllMessages))
    .post((0, validate_1.default)(messageSchemas_1.createMessageSchema), (0, catchAsync_1.catchAsync)(messageController_1.createMessage));
messageRouter.param("id", (0, loggers_1.loggerMiddlewareFunction)(loggers_1.messageLogger));
messageRouter.route("/me").get((0, catchAsync_1.catchAsync)(messageController_1.getUserMessages));
messageRouter
    .route("/test")
    .post((0, validate_1.default)(messageSchemas_1.testMessageSchema), (0, catchAsync_1.catchAsync)(messageController_1.testMessageDeliveryController));
messageRouter
    .route("/test-send")
    .post((0, validate_1.default)(messageSchemas_1.testMessageSchema), (0, catchAsync_1.catchAsync)(messageController_1.testMessageDeliveryController));
messageRouter
    .route("/test/queue")
    .get((0, catchAsync_1.catchAsync)(messageController_1.getRecentQueuedMailJobsController));
messageRouter
    .route("/test/queue/:jobId")
    .get((0, catchAsync_1.catchAsync)(messageController_1.getQueuedMailJobStatusController));
messageRouter
    .route("/:id")
    .get((0, catchAsync_1.catchAsync)(messageController_1.getMessageById))
    .delete((0, catchAsync_1.catchAsync)(messageController_1.deleteMessageByMessageId))
    .patch((0, validate_1.default)(messageSchemas_1.updateMessageSchema), (0, catchAsync_1.catchAsync)(messageController_1.updateMessage));
exports.default = messageRouter;
