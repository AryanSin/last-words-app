"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentQueuedMailJobs = exports.getQueuedMailJobStatus = exports.runMessageDeliveryTest = void 0;
const client_1 = require("@prisma/client");
const emailService_1 = require("../integrations/emailService");
const whatsappService_1 = require("../integrations/whatsappService");
const emailQueue_1 = require("../queues/emailQueue");
const pushNotificationService_1 = require("./pushNotificationService");
const loggers_1 = require("../utils/loggers");
const DEFAULT_TIMEOUT_MS = 5000;
const withTimeout = (promise, ms = DEFAULT_TIMEOUT_MS, label = "Operation") => {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms (network or server unresponsive)`)), ms)),
    ]);
};
const runMessageDeliveryTest = async (params, currentUser) => {
    const results = {};
    const servicesToTest = [];
    const title = params.title || "Last Words Test Dispatch";
    const content = params.content ||
        `This is a test message from Last Words to verify message delivery services at ${new Date().toISOString()}.`;
    const targetEmail = params.recipientEmail ||
        currentUser?.email ||
        process.env.SMTP_USER ||
        "test-recipient@example.com";
    const targetPhone = params.recipientPhone ||
        currentUser?.phoneNumber ||
        "+14155552671";
    // Determine which services to test
    if (params.service) {
        const s = params.service.toLowerCase();
        if (s === "all") {
            servicesToTest.push("smtp", "twilio", "meta", "dev");
            if (params.deviceToken || currentUser?.id) {
                servicesToTest.push("expo");
            }
        }
        else if (s === "smtp" || s === "email") {
            servicesToTest.push("smtp");
        }
        else if (s === "twilio") {
            servicesToTest.push("twilio");
        }
        else if (s === "meta") {
            servicesToTest.push("meta");
        }
        else if (s === "dev") {
            servicesToTest.push("dev");
        }
        else if (s === "expo" || s === "push") {
            servicesToTest.push("expo");
        }
    }
    else if (params.channel) {
        if (params.channel === client_1.DeliveryChannel.EMAIL) {
            servicesToTest.push("smtp");
        }
        else if (params.channel === client_1.DeliveryChannel.WHATSAPP) {
            servicesToTest.push("whatsapp_active");
        }
        else if (params.channel === client_1.DeliveryChannel.BOTH) {
            servicesToTest.push("smtp", "whatsapp_active");
        }
    }
    else {
        // Inferred based on inputs provided
        if (params.recipientEmail && !params.recipientPhone) {
            servicesToTest.push("smtp");
        }
        else if (params.recipientPhone && !params.recipientEmail) {
            if (params.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID) {
                servicesToTest.push("twilio");
            }
            else {
                servicesToTest.push("whatsapp_active");
            }
        }
        else if (params.deviceToken) {
            servicesToTest.push("expo");
        }
        else {
            // Default: test SMTP and active WhatsApp provider
            servicesToTest.push("smtp", "whatsapp_active");
        }
    }
    // Execute all service tests in parallel with individual timeouts
    const testPromises = servicesToTest.map(async (s) => {
        const serviceStartTime = Date.now();
        switch (s) {
            case "smtp": {
                try {
                    if (params.sync) {
                        // Synchronous delivery with timeout (e.g. for deterministic unit/integration tests)
                        await withTimeout((0, emailService_1.initializeEmailService)(true), 3000, "SMTP initialization");
                        if (params.smtpHost && params.smtpUser && params.smtpPass) {
                            const sendRes = await withTimeout((0, emailService_1.sendCustomEmail)({
                                host: params.smtpHost,
                                port: params.smtpPort,
                                secure: params.smtpSecure,
                                user: params.smtpUser,
                                pass: params.smtpPass,
                                to: targetEmail,
                                subject: title,
                                content,
                                senderName: currentUser?.name || "Last Words Admin",
                                recipientName: "Test Recipient",
                            }), DEFAULT_TIMEOUT_MS, "SMTP Send");
                            results["smtp"] = {
                                success: true,
                                provider: "smtp",
                                recipient: targetEmail,
                                messageId: sendRes.messageId,
                                previewUrl: sendRes.previewUrl,
                                durationMs: Date.now() - serviceStartTime,
                                details: {
                                    host: params.smtpHost,
                                    mode: "custom_credentials",
                                    sync: true,
                                },
                            };
                        }
                        else {
                            const sendRes = await withTimeout((0, emailService_1.sendEmail)(targetEmail, title, content, currentUser?.name || "Last Words Admin", "Test Recipient"), DEFAULT_TIMEOUT_MS, "SMTP Send");
                            results["smtp"] = {
                                success: true,
                                provider: "smtp",
                                recipient: targetEmail,
                                messageId: sendRes.messageId,
                                previewUrl: sendRes.previewUrl,
                                durationMs: Date.now() - serviceStartTime,
                                details: {
                                    host: process.env.SMTP_HOST || "smtp.ethereal.email (fallback)",
                                    mode: process.env.SMTP_HOST ? "live_smtp" : "ethereal_test_inbox",
                                    sync: true,
                                },
                            };
                        }
                    }
                    else {
                        // Asynchronous Queueing: Add to emailQueue and return success immediately!
                        const jobId = emailQueue_1.emailQueue.enqueueMail({
                            to: targetEmail,
                            subject: title,
                            content,
                            senderName: currentUser?.name || "Last Words Admin",
                            recipientName: "Test Recipient",
                            customOptions: params.smtpHost && params.smtpUser && params.smtpPass
                                ? {
                                    host: params.smtpHost,
                                    port: params.smtpPort,
                                    secure: params.smtpSecure,
                                    user: params.smtpUser,
                                    pass: params.smtpPass,
                                    to: targetEmail,
                                    subject: title,
                                    content,
                                    senderName: currentUser?.name || "Last Words Admin",
                                    recipientName: "Test Recipient",
                                }
                                : undefined,
                        });
                        results["smtp"] = {
                            success: true,
                            provider: "smtp",
                            recipient: targetEmail,
                            messageId: jobId,
                            durationMs: Date.now() - serviceStartTime,
                            details: {
                                status: "queued",
                                queue: "emailQueue",
                                jobId,
                                mode: "background_mailing_queue",
                                host: params.smtpHost || process.env.SMTP_HOST || "smtp.gmail.com",
                                message: "Test mail added to queue successfully. Processing in background without timeouts.",
                            },
                        };
                    }
                }
                catch (err) {
                    loggers_1.logger.error("[MessageTestService] SMTP test failed:", err);
                    results["smtp"] = {
                        success: false,
                        provider: "smtp",
                        recipient: targetEmail,
                        error: err?.message || String(err),
                        durationMs: Date.now() - serviceStartTime,
                        details: {
                            host: params.smtpHost || process.env.SMTP_HOST || "none",
                        },
                    };
                }
                break;
            }
            case "twilio": {
                try {
                    const twilioClient = new whatsappService_1.TwilioWhatsAppService(params.twilioAccountSid, params.twilioAuthToken, params.twilioFromNumber);
                    const mode = params.twilioMode || "whatsapp";
                    let sendRes;
                    if (mode === "sms") {
                        sendRes = await withTimeout(twilioClient.sendSms(targetPhone, content, params.twilioFromNumber), DEFAULT_TIMEOUT_MS, "Twilio SMS");
                    }
                    else {
                        sendRes = await withTimeout(twilioClient.sendMessage(targetPhone, content, title), DEFAULT_TIMEOUT_MS, "Twilio WhatsApp");
                    }
                    results["twilio"] = {
                        success: sendRes.success,
                        provider: "twilio",
                        recipient: targetPhone,
                        messageId: sendRes.messageId,
                        error: sendRes.error,
                        durationMs: Date.now() - serviceStartTime,
                        details: {
                            mode,
                        },
                    };
                }
                catch (err) {
                    loggers_1.logger.error("[MessageTestService] Twilio test failed:", err);
                    results["twilio"] = {
                        success: false,
                        provider: "twilio",
                        recipient: targetPhone,
                        error: err?.message || String(err),
                        durationMs: Date.now() - serviceStartTime,
                    };
                }
                break;
            }
            case "meta": {
                try {
                    const metaClient = new whatsappService_1.MetaCloudWhatsAppService();
                    const sendRes = await withTimeout(metaClient.sendMessage(targetPhone, content, title), DEFAULT_TIMEOUT_MS, "Meta WhatsApp");
                    results["meta"] = {
                        success: sendRes.success,
                        provider: "meta",
                        recipient: targetPhone,
                        messageId: sendRes.messageId,
                        error: sendRes.error,
                        durationMs: Date.now() - serviceStartTime,
                    };
                }
                catch (err) {
                    results["meta"] = {
                        success: false,
                        provider: "meta",
                        recipient: targetPhone,
                        error: err?.message || String(err),
                        durationMs: Date.now() - serviceStartTime,
                    };
                }
                break;
            }
            case "dev": {
                try {
                    const devClient = new whatsappService_1.DevWhatsAppService();
                    const sendRes = await devClient.sendMessage(targetPhone, content, title);
                    results["dev"] = {
                        success: true,
                        provider: "dev",
                        recipient: targetPhone,
                        messageId: sendRes.messageId,
                        durationMs: Date.now() - serviceStartTime,
                    };
                }
                catch (err) {
                    results["dev"] = {
                        success: false,
                        provider: "dev",
                        recipient: targetPhone,
                        error: err?.message || String(err),
                        durationMs: Date.now() - serviceStartTime,
                    };
                }
                break;
            }
            case "whatsapp_active": {
                try {
                    const sendRes = await withTimeout(whatsappService_1.whatsappService.sendMessage(targetPhone, content, title), DEFAULT_TIMEOUT_MS, "WhatsApp active provider");
                    results["whatsapp"] = {
                        success: sendRes.success,
                        provider: (process.env.WHATSAPP_PROVIDER || "dev").toLowerCase(),
                        recipient: targetPhone,
                        messageId: sendRes.messageId,
                        error: sendRes.error,
                        durationMs: Date.now() - serviceStartTime,
                    };
                }
                catch (err) {
                    results["whatsapp"] = {
                        success: false,
                        provider: (process.env.WHATSAPP_PROVIDER || "dev").toLowerCase(),
                        recipient: targetPhone,
                        error: err?.message || String(err),
                        durationMs: Date.now() - serviceStartTime,
                    };
                }
                break;
            }
            case "expo": {
                try {
                    let tokens = [];
                    if (params.deviceToken) {
                        tokens = [params.deviceToken];
                    }
                    else if (currentUser?.id) {
                        tokens = await pushNotificationService_1.pushNotificationService.getUserDeviceTokens(currentUser.id);
                    }
                    if (tokens.length === 0) {
                        results["expo"] = {
                            success: false,
                            provider: "expo",
                            error: "No push notification device token provided or found for user.",
                            durationMs: Date.now() - serviceStartTime,
                        };
                    }
                    else {
                        const pushRes = await withTimeout(pushNotificationService_1.pushNotificationService.sendPushNotification(tokens, {
                            title,
                            body: content,
                        }), DEFAULT_TIMEOUT_MS, "Expo Push");
                        const allOk = pushRes.every((r) => r.status === "ok");
                        results["expo"] = {
                            success: allOk,
                            provider: "expo",
                            details: { receipts: pushRes },
                            durationMs: Date.now() - serviceStartTime,
                        };
                    }
                }
                catch (err) {
                    results["expo"] = {
                        success: false,
                        provider: "expo",
                        error: err?.message || String(err),
                        durationMs: Date.now() - serviceStartTime,
                    };
                }
                break;
            }
        }
    });
    await Promise.allSettled(testPromises);
    const testedKeys = Object.keys(results);
    const overallSuccess = testedKeys.length > 0 && testedKeys.every((k) => results[k].success);
    let message = "All tested messaging services succeeded";
    if (testedKeys.length === 0) {
        message = "No messaging services were tested";
    }
    else if (!overallSuccess) {
        const failedServices = testedKeys.filter((k) => !results[k].success);
        message = `Message delivery test failed for: ${failedServices.join(", ")}`;
    }
    return {
        overallSuccess,
        message,
        servicesTested: testedKeys,
        results,
        timestamp: new Date().toISOString(),
    };
};
exports.runMessageDeliveryTest = runMessageDeliveryTest;
const getQueuedMailJobStatus = (jobId) => {
    return emailQueue_1.emailQueue.getJobStatus(jobId);
};
exports.getQueuedMailJobStatus = getQueuedMailJobStatus;
const getRecentQueuedMailJobs = () => {
    return emailQueue_1.emailQueue.getRecentJobs();
};
exports.getRecentQueuedMailJobs = getRecentQueuedMailJobs;
