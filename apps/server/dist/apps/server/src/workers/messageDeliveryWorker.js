"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageDeliveryWorker = exports.createMessageDeliveryWorker = exports.processDeliveryJob = void 0;
const client_1 = require("@prisma/client");
const bullmq_1 = require("bullmq");
const constants_1 = require("../config/constants");
const prisma_1 = __importDefault(require("../config/prisma"));
const redis_1 = require("../config/redis");
const emailService_1 = require("../integrations/emailService");
const whatsappService_1 = require("../integrations/whatsappService");
const messageDeliveryQueue_1 = require("../queues/messageDeliveryQueue");
const crypto_1 = require("../utils/crypto");
const loggers_1 = require("../utils/loggers");
const processDeliveryJob = async (job) => {
    const { messageId } = job.data;
    (0, loggers_1.messageJobLogger)(`[Worker] Processing delivery job ${job.id} for message ID ${messageId}`);
    const message = await prisma_1.default.message.findUnique({
        where: { id: messageId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                },
            },
        },
    });
    if (!message) {
        loggers_1.logger.warn(`[Worker] Message with ID ${messageId} not found. Skipping job.`);
        return { skipped: true, reason: "Message not found" };
    }
    if (message.status === client_1.MessageStatus.SENT) {
        (0, loggers_1.messageJobLogger)(`[Worker] Message ${messageId} already marked as SENT. Skipping.`);
        return { skipped: true, reason: "Already sent" };
    }
    let plainContent = message.content;
    let plainTitle = message.title;
    try {
        plainContent = (0, crypto_1.decryptMessage)(message.content);
        plainTitle = (0, crypto_1.decryptMessageNullable)(message.title);
    }
    catch (err) {
        loggers_1.logger.error(`[Worker] Decryption failed for message ${messageId}:`, err);
        throw new Error(`Message decryption failed: ${err?.message || err}`);
    }
    const channel = message.deliveryChannel;
    const targetEmail = message.recipientEmail || message.user.email;
    const targetPhone = message.recipientPhone || message.user.phoneNumber;
    const events = [];
    let emailSuccess = false;
    let whatsAppSuccess = false;
    const errors = [];
    if (channel === client_1.DeliveryChannel.EMAIL || channel === client_1.DeliveryChannel.BOTH) {
        if (targetEmail) {
            try {
                const subject = plainTitle || `Message from ${message.user.name || "Last Words"}`;
                await (0, emailService_1.sendEmail)(targetEmail, subject, plainContent, message.user.name, message.recipientName);
                events.push({
                    channel: client_1.DeliveryChannel.EMAIL,
                    recipient: targetEmail,
                    success: true,
                });
                emailSuccess = true;
            }
            catch (err) {
                const errorMsg = err?.message || String(err);
                errors.push(`Email: ${errorMsg}`);
                events.push({
                    channel: client_1.DeliveryChannel.EMAIL,
                    recipient: targetEmail,
                    success: false,
                    error: errorMsg.slice(0, 500),
                });
            }
        }
        else {
            errors.push("Email channel selected but no recipient email configured");
            events.push({
                channel: client_1.DeliveryChannel.EMAIL,
                recipient: "unknown",
                success: false,
                error: "Missing recipient email address",
            });
        }
    }
    if (channel === client_1.DeliveryChannel.WHATSAPP || channel === client_1.DeliveryChannel.BOTH) {
        if (targetPhone) {
            try {
                const waResult = await whatsappService_1.whatsappService.sendMessage(targetPhone, plainContent, plainTitle || undefined);
                if (waResult.success) {
                    events.push({
                        channel: client_1.DeliveryChannel.WHATSAPP,
                        recipient: targetPhone,
                        success: true,
                    });
                    whatsAppSuccess = true;
                }
                else {
                    const errorMsg = waResult.error || "WhatsApp delivery failed";
                    errors.push(`WhatsApp: ${errorMsg}`);
                    events.push({
                        channel: client_1.DeliveryChannel.WHATSAPP,
                        recipient: targetPhone,
                        success: false,
                        error: errorMsg.slice(0, 500),
                    });
                }
            }
            catch (err) {
                const errorMsg = err?.message || String(err);
                errors.push(`WhatsApp: ${errorMsg}`);
                events.push({
                    channel: client_1.DeliveryChannel.WHATSAPP,
                    recipient: targetPhone,
                    success: false,
                    error: errorMsg.slice(0, 500),
                });
            }
        }
        else {
            errors.push("WhatsApp channel selected but no recipient phone configured");
            events.push({
                channel: client_1.DeliveryChannel.WHATSAPP,
                recipient: "unknown",
                success: false,
                error: "Missing recipient phone number",
            });
        }
    }
    // Persist delivery events to database
    if (events.length > 0) {
        await prisma_1.default.deliveryEvent.createMany({
            data: events.map((ev) => ({
                messageId: message.id,
                channel: ev.channel,
                recipient: ev.recipient,
                success: ev.success,
                error: ev.error ?? null,
            })),
        });
    }
    // Update aggregated system metrics
    const emailSuccessInc = events.filter((e) => e.channel === client_1.DeliveryChannel.EMAIL && e.success).length;
    const emailFailInc = events.filter((e) => e.channel === client_1.DeliveryChannel.EMAIL && !e.success).length;
    const waSuccessInc = events.filter((e) => e.channel === client_1.DeliveryChannel.WHATSAPP && e.success).length;
    const waFailInc = events.filter((e) => e.channel === client_1.DeliveryChannel.WHATSAPP && !e.success).length;
    await prisma_1.default.systemMetric.upsert({
        where: { id: 1 },
        create: {
            id: 1,
            totalEmailsSent: emailSuccessInc,
            totalEmailFailures: emailFailInc,
            totalWhatsAppSent: waSuccessInc,
            totalWhatsAppFail: waFailInc,
        },
        update: {
            totalEmailsSent: { increment: emailSuccessInc },
            totalEmailFailures: { increment: emailFailInc },
            totalWhatsAppSent: { increment: waSuccessInc },
            totalWhatsAppFail: { increment: waFailInc },
        },
    });
    // Evaluate overall delivery success based on required channel
    const isOverallSuccess = (channel === client_1.DeliveryChannel.EMAIL && emailSuccess) ||
        (channel === client_1.DeliveryChannel.WHATSAPP && whatsAppSuccess) ||
        (channel === client_1.DeliveryChannel.BOTH && (emailSuccess || whatsAppSuccess));
    if (isOverallSuccess) {
        await prisma_1.default.message.update({
            where: { id: message.id },
            data: {
                status: client_1.MessageStatus.SENT,
                sentAt: new Date(),
                lastError: null,
            },
        });
        (0, loggers_1.messageJobLogger)(`[Worker] Successfully delivered message ${message.id}`);
        return { success: true, messageId: message.id, events };
    }
    else {
        const combinedError = errors.join("; ");
        const newFailedAttempts = message.failedAttempts + 1;
        const shouldMarkFailed = newFailedAttempts >= constants_1.MAX_MAIL_RETRIES;
        await prisma_1.default.message.update({
            where: { id: message.id },
            data: {
                status: shouldMarkFailed ? client_1.MessageStatus.FAILED : message.status,
                failedAttempts: { increment: 1 },
                lastError: combinedError.slice(0, 500),
            },
        });
        (0, loggers_1.messageJobLogger)(`[Worker] Delivery failed for message ${message.id} (Attempt ${newFailedAttempts}): ${combinedError}`);
        throw new Error(combinedError);
    }
};
exports.processDeliveryJob = processDeliveryJob;
const createMessageDeliveryWorker = (concurrency = 5) => {
    const worker = new bullmq_1.Worker(messageDeliveryQueue_1.MESSAGE_DELIVERY_QUEUE_NAME, async (job) => (0, exports.processDeliveryJob)(job), {
        connection: redis_1.redisConnectionOptions,
        concurrency,
    });
    worker.on("completed", (job) => {
        loggers_1.logger.info(`[BullMQ Worker] Job ${job.id} (messageId: ${job.data.messageId}) completed.`);
    });
    worker.on("failed", (job, err) => {
        loggers_1.logger.error(`[BullMQ Worker] Job ${job?.id} (messageId: ${job?.data?.messageId}) failed: ${err.message}`);
    });
    worker.on("error", (err) => {
        loggers_1.logger.error("[BullMQ Worker] Worker error:", err);
    });
    return worker;
};
exports.createMessageDeliveryWorker = createMessageDeliveryWorker;
exports.messageDeliveryWorker = (0, exports.createMessageDeliveryWorker)();
