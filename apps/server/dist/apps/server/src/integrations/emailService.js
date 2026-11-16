"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCustomEmail = exports.verifyEmailConnection = exports.sendEmail = exports.initializeEmailService = exports.resetTransporter = void 0;
const dns_1 = __importDefault(require("dns"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const emailTemplates_1 = require("../templates/emailTemplates");
const loggers_1 = require("../utils/loggers");
// Prefer IPv4 DNS lookups to avoid TCP SYN hang on systems without IPv6 route
try {
    dns_1.default.setDefaultResultOrder("ipv4first");
}
catch {
    // Ignore in environments where setDefaultResultOrder is unavailable
}
let transporter = null;
const resetTransporter = () => {
    transporter = null;
};
exports.resetTransporter = resetTransporter;
const initializeEmailService = async (forceReload = false) => {
    if (transporter && !forceReload) {
        return;
    }
    try {
        const smtpHost = process.env.SMTP_HOST;
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        if (smtpHost && smtpUser && smtpPass) {
            const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
            const secure = process.env.SMTP_SECURE === "true" || port === 465;
            transporter = nodemailer_1.default.createTransport({
                host: smtpHost,
                port,
                secure,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
                connectionTimeout: 6000,
                greetingTimeout: 5000,
                socketTimeout: 8000,
            });
            loggers_1.logger.info(`Initialized live SMTP transport (${smtpHost}:${port})`);
            return;
        }
        // Dev fallback: Ethereal test account
        const testAccount = await nodemailer_1.default.createTestAccount();
        loggers_1.logger.info(`Initialized test email transport (${testAccount.user})`);
        transporter = nodemailer_1.default.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
            connectionTimeout: 6000,
            greetingTimeout: 5000,
            socketTimeout: 8000,
            dnsTimeout: 5000,
        });
    }
    catch (err) {
        loggers_1.logger.error("Failed to initialize email transport:", err);
    }
};
exports.initializeEmailService = initializeEmailService;
const sendEmail = async (to, subject, content, senderName, recipientName) => {
    if (!transporter) {
        await (0, exports.initializeEmailService)();
        if (!transporter) {
            throw new Error("Email service is not initialized");
        }
    }
    const mail = (0, emailTemplates_1.buildMessageEmail)(subject, content, senderName, recipientName);
    const fromAddress = process.env.SMTP_FROM || '"Last Words" <noreply@lastwords.app>';
    const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject: mail.subject,
        html: mail.html,
    });
    const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
    loggers_1.logger.info(`[EmailService] Message sent: ${info.messageId} | Preview: ${previewUrl}`);
    return { messageId: info.messageId, previewUrl };
};
exports.sendEmail = sendEmail;
const verifyEmailConnection = async () => {
    try {
        if (!transporter) {
            await (0, exports.initializeEmailService)();
        }
        if (!transporter) {
            return { success: false, error: "Email transporter not initialized" };
        }
        await transporter.verify();
        return { success: true };
    }
    catch (err) {
        return { success: false, error: err?.message || String(err) };
    }
};
exports.verifyEmailConnection = verifyEmailConnection;
const sendCustomEmail = async (options) => {
    const port = options.port || 587;
    const secure = options.secure ?? (port === 465);
    const customTransporter = nodemailer_1.default.createTransport({
        host: options.host,
        port,
        secure,
        auth: {
            user: options.user,
            pass: options.pass,
        },
        connectionTimeout: 6000,
        greetingTimeout: 5000,
        socketTimeout: 8000,
    });
    const mail = (0, emailTemplates_1.buildMessageEmail)(options.subject, options.content, options.senderName, options.recipientName);
    const fromAddress = options.from || process.env.SMTP_FROM || `"${options.senderName || "Last Words"}" <${options.user}>`;
    const info = await customTransporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: mail.subject,
        html: mail.html,
    });
    const previewUrl = nodemailer_1.default.getTestMessageUrl(info);
    return { messageId: info.messageId, previewUrl };
};
exports.sendCustomEmail = sendCustomEmail;
