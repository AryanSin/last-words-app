"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentQueuedMailJobsController = exports.getQueuedMailJobStatusController = exports.testMessageDeliveryController = exports.updateMessage = exports.deleteMessageByMessageId = exports.getMessageById = exports.getUserMessages = exports.createMessage = exports.getAllMessages = void 0;
const client_1 = require("@prisma/client");
const messageDto_1 = require("../dto/messageDto");
const messageServices_1 = __importDefault(require("../services/messageServices"));
const messageTestService_1 = require("../services/messageTestService");
const AppError_1 = __importDefault(require("../utils/AppError"));
const pagination_1 = require("../utils/pagination");
const successResponse_1 = __importDefault(require("../utils/successResponse"));
const getAllMessages = async (req, res, next) => {
    const userId = Number(req.user?.id);
    if (!userId) {
        throw new AppError_1.default("Unauthorized", 401);
    }
    const { take, skip } = (0, pagination_1.getPagination)(req);
    const messages = await messageServices_1.default.getMessagesSortedByUrgency({
        userId,
        take,
        skip,
    });
    return (0, successResponse_1.default)(res, messages.map(messageDto_1.toMessageResponseDtoWithMessageStatus), 200);
};
exports.getAllMessages = getAllMessages;
const createMessage = async (req, res, next) => {
    const data = req.parsedData;
    const userId = Number(req.user?.id);
    if (!userId) {
        throw new AppError_1.default("Unauthorized", 401);
    }
    const message = await messageServices_1.default.createMessage({
        title: data.title,
        content: data.content,
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail || null,
        recipientPhone: data.recipientPhone || null,
        deliveryChannel: data.deliveryChannel || "EMAIL",
        triggerAfterDays: data.triggerAfterDays,
        user: {
            connect: { id: userId },
        },
    });
    return (0, successResponse_1.default)(res, (0, messageDto_1.toMessageResponseDto)(message), 201);
};
exports.createMessage = createMessage;
const getUserMessages = async (req, res, next) => {
    const userId = Number(req.user?.id);
    if (!userId) {
        throw new AppError_1.default("Unauthorized", 401);
    }
    const { take, skip } = (0, pagination_1.getPagination)(req);
    const messages = await messageServices_1.default.getMessagesSortedByUrgency({
        userId,
        take,
        skip,
    });
    return (0, successResponse_1.default)(res, messages.map(messageDto_1.toMessageResponseDtoWithMessageStatus), 200);
};
exports.getUserMessages = getUserMessages;
const getMessageById = async (req, res, next) => {
    const id = Number(req.params.id);
    const userId = Number(req.user?.id);
    const message = await messageServices_1.default.getMessageByIdAndUserId(id, userId);
    if (!message) {
        throw new AppError_1.default("Message not found", 404);
    }
    return (0, successResponse_1.default)(res, (0, messageDto_1.toMessageResponseDtoWithMessageStatus)(message), 200);
};
exports.getMessageById = getMessageById;
const deleteMessageByMessageId = async (req, res, next) => {
    const id = Number(req.params.id);
    const userId = Number(req.user?.id);
    const message = await messageServices_1.default.getMessageByIdAndUserId(id, userId);
    if (!message) {
        throw new AppError_1.default("Message not found", 404);
    }
    await messageServices_1.default.deleteMessageById(id);
    return res.status(204).send();
};
exports.deleteMessageByMessageId = deleteMessageByMessageId;
const updateMessage = async (req, res, next) => {
    const data = req.parsedData;
    const id = Number(req.params.id);
    const userId = Number(req.user?.id);
    const message = await messageServices_1.default.getMessageByIdAndUserId(id, userId);
    if (!message) {
        throw new AppError_1.default("Message not found", 404);
    }
    // Any message not in delivered (SENT) status is editable
    if (message.status === client_1.MessageStatus.SENT) {
        throw new AppError_1.default("Delivered messages cannot be edited", 400);
    }
    const updatedMessage = await messageServices_1.default.updateMessage(id, {
        title: data.title !== undefined ? data.title : message.title,
        content: data.content !== undefined ? data.content : message.content,
        recipientName: data.recipientName !== undefined
            ? data.recipientName
            : message.recipientName,
        recipientEmail: data.recipientEmail !== undefined
            ? data.recipientEmail || null
            : message.recipientEmail,
        recipientPhone: data.recipientPhone !== undefined
            ? data.recipientPhone || null
            : message.recipientPhone,
        deliveryChannel: data.deliveryChannel !== undefined
            ? data.deliveryChannel
            : message.deliveryChannel,
        triggerAfterDays: data.triggerAfterDays !== undefined
            ? data.triggerAfterDays
            : message.triggerAfterDays,
        // Reset failed messages to pending upon successful modification
        ...(message.status === client_1.MessageStatus.FAILED
            ? { status: client_1.MessageStatus.PENDING, failedAttempts: 0, lastError: null }
            : {}),
    });
    return (0, successResponse_1.default)(res, (0, messageDto_1.toMessageResponseDtoWithMessageStatus)(updatedMessage), 200);
};
exports.updateMessage = updateMessage;
const testMessageDeliveryController = async (req, res, next) => {
    const data = (req.parsedData || req.body);
    const currentUser = req.user || null;
    const report = await (0, messageTestService_1.runMessageDeliveryTest)(data, currentUser);
    return (0, successResponse_1.default)(res, report, 200);
};
exports.testMessageDeliveryController = testMessageDeliveryController;
const getQueuedMailJobStatusController = async (req, res, next) => {
    const jobId = String(req.params.jobId);
    const job = (0, messageTestService_1.getQueuedMailJobStatus)(jobId);
    if (!job) {
        throw new AppError_1.default("Queued email job not found", 404);
    }
    return (0, successResponse_1.default)(res, job, 200);
};
exports.getQueuedMailJobStatusController = getQueuedMailJobStatusController;
const getRecentQueuedMailJobsController = async (req, res, next) => {
    const jobs = (0, messageTestService_1.getRecentQueuedMailJobs)();
    return (0, successResponse_1.default)(res, jobs, 200);
};
exports.getRecentQueuedMailJobsController = getRecentQueuedMailJobsController;
