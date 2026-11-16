"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMessageTriggerService = void 0;
const client_1 = require("@prisma/client");
const constants_1 = require("../config/constants");
const prisma_1 = __importDefault(require("../config/prisma"));
const messageTriggerHelpers_1 = require("../helpers/messageTriggerHelpers");
const messageDeliveryQueue_1 = require("../queues/messageDeliveryQueue");
const loggers_1 = require("../utils/loggers");
const runMessageTriggerService = async () => {
    const startDate = new Date();
    let cronJobExecution = {
        startedAt: startDate,
        jobName: "messageTriggerService",
        status: "RUNNING",
    };
    try {
        const messageList = await prisma_1.default.message.findMany({
            where: {
                status: {
                    not: client_1.MessageStatus.SENT,
                },
                failedAttempts: {
                    lt: constants_1.MAX_MAIL_RETRIES,
                },
            },
            select: {
                id: true,
                triggerAfterDays: true,
                user: {
                    select: {
                        id: true,
                        lastLoginAt: true,
                        defaultTriggerAfterDays: true,
                    },
                },
            },
        });
        const messagesToTrigger = messageList.filter((message) => (0, messageTriggerHelpers_1.shouldTriggerMessage)(message, message.user));
        (0, loggers_1.messageJobLogger)(`[TriggerService] Found ${messageList.length} pending candidate messages. Triggering ${messagesToTrigger.length} overdue messages.`);
        if (messagesToTrigger.length > 0) {
            const jobs = messagesToTrigger.map((msg) => ({
                name: `send-message-${msg.id}`,
                data: { messageId: msg.id },
                opts: {
                    jobId: `msg-${msg.id}-${Date.now()}`,
                    attempts: 3,
                    backoff: {
                        type: "exponential",
                        delay: 5000,
                    },
                },
            }));
            await messageDeliveryQueue_1.messageDeliveryQueue.addBulk(jobs);
            (0, loggers_1.messageJobLogger)(`[TriggerService] Successfully enqueued ${jobs.length} delivery jobs to BullMQ.`);
        }
        cronJobExecution = {
            ...cronJobExecution,
            successCount: messagesToTrigger.length,
            failureCount: 0,
            completedAt: new Date(),
            status: "COMPLETED",
        };
    }
    catch (err) {
        loggers_1.logger.error("Message trigger service failed:", err);
        cronJobExecution = {
            ...cronJobExecution,
            completedAt: new Date(),
            status: `FAILED: ${String(err?.message || err).slice(0, 200)}`,
        };
    }
    await prisma_1.default.jobExecution.create({
        data: cronJobExecution,
    });
};
exports.runMessageTriggerService = runMessageTriggerService;
