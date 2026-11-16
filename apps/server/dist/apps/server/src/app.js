"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const messageSchemas_1 = require("@shared/schemas/messageSchemas");
const messageController_1 = require("./controllers/messageController");
const swagger_1 = __importDefault(require("./docs/swagger"));
const authMiddleware_1 = require("./middleware/authMiddleware");
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const globalRateLimiter_1 = __importDefault(require("./middleware/rateLimiter/globalRateLimiter"));
const messageRateLimiter_1 = __importDefault(require("./middleware/rateLimiter/messageRateLimiter"));
const requestBodyModificationMiddleWare_1 = require("./middleware/requestBodyModificationMiddleWare");
const validate_1 = __importDefault(require("./middleware/validate"));
const authRouter_1 = __importDefault(require("./routes/authRouter"));
const jobRouter_1 = __importDefault(require("./routes/jobRouter"));
const messageRouter_1 = __importDefault(require("./routes/messageRouter"));
const metricRouter_1 = __importDefault(require("./routes/metricRouter"));
const userRouter_1 = __importDefault(require("./routes/userRouter"));
const catchAsync_1 = require("./utils/catchAsync");
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(logger_1.httpLogger);
app.use(requestBodyModificationMiddleWare_1.addRequestTime);
app.use(globalRateLimiter_1.default);
app.use("/docs", swagger_1.default);
app.get("/", (req, res) => {
    res.json({
        name: "Last Words API",
        status: "healthy",
        timestamp: new Date().toISOString(),
    });
});
app.get("/health", (req, res) => {
    res.json({ status: "healthy", uptime: process.uptime() });
});
app.use("/jobs", jobRouter_1.default);
app.use("/auth", authRouter_1.default);
app.post([
    "/messages/test",
    "/messages/test/",
    "/messages/test-send",
    "/messages/test-send/",
], messageRateLimiter_1.default, (0, catchAsync_1.catchAsync)(authMiddleware_1.optionalAuthenticateToken), (0, validate_1.default)(messageSchemas_1.testMessageSchema), (0, catchAsync_1.catchAsync)(messageController_1.testMessageDeliveryController));
app.get(["/messages/test/queue", "/messages/test/queue/"], (0, catchAsync_1.catchAsync)(messageController_1.getRecentQueuedMailJobsController));
app.get("/messages/test/queue/:jobId", (0, catchAsync_1.catchAsync)(messageController_1.getQueuedMailJobStatusController));
app.use((0, catchAsync_1.catchAsync)(authMiddleware_1.authenticateToken));
app.use("/metrics", metricRouter_1.default);
app.use("/users", userRouter_1.default);
app.use("/messages", messageRouter_1.default);
app.use(errorMiddleware_1.prismaErrorHandler, errorMiddleware_1.globalErrorHandler);
exports.default = app;
