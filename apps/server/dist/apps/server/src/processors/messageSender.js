"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessages = void 0;
const client_1 = require("@prisma/client");
const emailService_1 = require("../integrations/emailService");
const whatsappService_1 = require("../integrations/whatsappService");
const emailQueue_1 = require("../queues/emailQueue");
const crypto_1 = require("../utils/crypto");
const loggers_1 = require("../utils/loggers");
const logMessageJobInfo = (argString = "", ...args) => {
    loggers_1.logger.info(argString, ...args);
    (0, loggers_1.messageJobLogger)(argString, ...args);
};
const logMessageJobError = (argString = "", ...args) => {
    loggers_1.logger.error(argString, ...args);
    (0, loggers_1.messageJobLogger)(argString, ...args);
};
const sendMessages = async (messages) => {
    const results = await Promise.allSettled(messages.map((message) => emailQueue_1.emailQueue.add(async () => {
        logMessageJobInfo(`Processing message ${message.id} for user ${message.user.id}`);
        let plainContent = message.content;
        let plainTitle = message.title;
        try {
            plainContent = (0, crypto_1.decryptMessage)(message.content);
            plainTitle = (0, crypto_1.decryptMessageNullable)(message.title);
        }
        catch (err) {
            logMessageJobError(`Failed to decrypt message ID ${message.id}:`, err);
            throw new Error(`Message decryption failed: ${err?.message || err}`);
        }
        const deliveryEvents = [];
        let anySuccess = false;
        const errors = [];
        const channel = message.deliveryChannel;
        const targetEmail = message.recipientEmail || message.user.email;
        const targetPhone = message.recipientPhone || message.user.phoneNumber;
        if (channel === client_1.DeliveryChannel.EMAIL || channel === client_1.DeliveryChannel.BOTH) {
            if (targetEmail) {
                try {
                    const subject = plainTitle || `Message from ${message.user.name || "Last Words"}`;
                    await (0, emailService_1.sendEmail)(targetEmail, subject, plainContent, message.user.name, message.recipientName);
                    deliveryEvents.push({
                        channel: client_1.DeliveryChannel.EMAIL,
                        recipient: targetEmail,
                        success: true,
                    });
                    anySuccess = true;
                }
                catch (err) {
                    const errorMsg = err?.message || String(err);
                    errors.push(`Email error: ${errorMsg}`);
                    deliveryEvents.push({
                        channel: client_1.DeliveryChannel.EMAIL,
                        recipient: targetEmail,
                        success: false,
                        error: errorMsg.slice(0, 500),
                    });
                }
            }
            else {
                errors.push("Email channel selected but no recipient email found");
            }
        }
        if (channel === client_1.DeliveryChannel.WHATSAPP || channel === client_1.DeliveryChannel.BOTH) {
            if (targetPhone) {
                try {
                    const waResult = await whatsappService_1.whatsappService.sendMessage(targetPhone, plainContent, plainTitle || undefined);
                    if (waResult.success) {
                        deliveryEvents.push({
                            channel: client_1.DeliveryChannel.WHATSAPP,
                            recipient: targetPhone,
                            success: true,
                        });
                        anySuccess = true;
                    }
                    else {
                        const errorMsg = waResult.error || "WhatsApp delivery failed";
                        errors.push(`WhatsApp error: ${errorMsg}`);
                        deliveryEvents.push({
                            channel: client_1.DeliveryChannel.WHATSAPP,
                            recipient: targetPhone,
                            success: false,
                            error: errorMsg.slice(0, 500),
                        });
                    }
                }
                catch (err) {
                    const errorMsg = err?.message || String(err);
                    errors.push(`WhatsApp error: ${errorMsg}`);
                    deliveryEvents.push({
                        channel: client_1.DeliveryChannel.WHATSAPP,
                        recipient: targetPhone,
                        success: false,
                        error: errorMsg.slice(0, 500),
                    });
                }
            }
            else {
                errors.push("WhatsApp channel selected but no recipient phone number found");
            }
        }
        if (!anySuccess && errors.length > 0) {
            throw new Error(errors.join("; "));
        }
        return {
            id: message.id,
            success: anySuccess,
            events: deliveryEvents,
            error: errors.length > 0 ? errors.join("; ") : undefined,
        };
    })));
    const successfullySentMessages = [];
    const failedMessages = [];
    const allEvents = [];
    results.forEach((res, index) => {
        const msg = messages[index];
        if (res.status === "fulfilled") {
            successfullySentMessages.push(res.value.id);
            logMessageJobInfo(`Successfully processed delivery for message ${res.value.id}`);
            res.value.events.forEach((ev) => {
                allEvents.push({
                    messageId: res.value.id,
                    ...ev,
                });
            });
        }
        else {
            failedMessages.push({
                id: msg.id,
                error: String(res.reason),
            });
            logMessageJobError(`Failed message delivery for ${msg.id}:`, res.reason);
        }
    });
    return {
        successfullySentMessages,
        failedMessages,
        allEvents,
    };
};
exports.sendMessages = sendMessages;
