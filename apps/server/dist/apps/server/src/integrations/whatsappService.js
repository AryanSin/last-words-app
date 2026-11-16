"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = exports.MetaCloudWhatsAppService = exports.TwilioWhatsAppService = exports.DevWhatsAppService = void 0;
const env_1 = require("../config/env");
const loggers_1 = require("../utils/loggers");
class DevWhatsAppService {
    async sendOtp(phoneNumber, otp) {
        console.log(`[dev-whatsapp] OTP -> ${phoneNumber}: ${otp}`);
        loggers_1.logger.info(`[DevWhatsApp] OTP sent to ${phoneNumber}: ${otp}`);
        return { success: true, messageId: `mock-otp-${Date.now()}` };
    }
    async sendMessage(phoneNumber, content, title) {
        console.log(`[dev-whatsapp] Message -> ${phoneNumber} | ${title || "No Title"}\n${content}`);
        loggers_1.logger.info(`[DevWhatsApp] Message delivered to ${phoneNumber}`);
        return { success: true, messageId: `mock-msg-${Date.now()}` };
    }
}
exports.DevWhatsAppService = DevWhatsAppService;
class TwilioWhatsAppService {
    accountSid;
    authToken;
    whatsappNumber;
    constructor(accountSid = env_1.TWILIO_ACCOUNT_SID, authToken = env_1.TWILIO_AUTH_TOKEN, whatsappNumber = env_1.TWILIO_WHATSAPP_NUMBER) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.whatsappNumber = whatsappNumber;
    }
    getAuthHeader() {
        return `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`;
    }
    async sendOtp(phoneNumber, otp) {
        const text = `Your Last Words verification code is: ${otp}. It will expire in 5 minutes.`;
        return this.sendTwilioMessage(phoneNumber, text);
    }
    async sendMessage(phoneNumber, content, title) {
        const text = title ? `*${title}*\n\n${content}` : content;
        return this.sendTwilioMessage(phoneNumber, text);
    }
    async sendSms(phoneNumber, content, fromNumber) {
        const from = fromNumber || this.whatsappNumber.replace("whatsapp:", "");
        return this.sendTwilioRaw(phoneNumber.replace("whatsapp:", ""), content, from);
    }
    async sendTwilioMessage(to, body) {
        const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
        const formattedFrom = this.whatsappNumber.startsWith("whatsapp:")
            ? this.whatsappNumber
            : `whatsapp:${this.whatsappNumber}`;
        return this.sendTwilioRaw(formattedTo, body, formattedFrom);
    }
    async sendTwilioRaw(to, body, from) {
        if (!this.accountSid || !this.authToken || !from) {
            return {
                success: false,
                error: "Twilio credentials or sender number not configured in environment or request.",
            };
        }
        try {
            const formData = new URLSearchParams();
            formData.append("To", to);
            formData.append("From", from);
            formData.append("Body", body);
            const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`, {
                method: "POST",
                headers: {
                    Authorization: this.getAuthHeader(),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
                signal: AbortSignal.timeout(6000),
            });
            const json = (await response.json());
            if (!response.ok) {
                const errorMsg = json.message || "Failed to send message via Twilio";
                loggers_1.logger.error(`Twilio error: ${errorMsg}`);
                return { success: false, error: errorMsg };
            }
            return { success: true, messageId: json.sid };
        }
        catch (err) {
            loggers_1.logger.error("Twilio Exception:", err);
            return { success: false, error: err?.message || String(err) };
        }
    }
}
exports.TwilioWhatsAppService = TwilioWhatsAppService;
class MetaCloudWhatsAppService {
    token;
    phoneNumberId;
    constructor(token = env_1.META_WHATSAPP_TOKEN, phoneNumberId = env_1.META_PHONE_NUMBER_ID) {
        this.token = token;
        this.phoneNumberId = phoneNumberId;
    }
    async sendOtp(phoneNumber, otp) {
        const text = `Your Last Words verification code is: ${otp}. Valid for 5 minutes.`;
        return this.sendMetaMessage(phoneNumber, text);
    }
    async sendMessage(phoneNumber, content, title) {
        const text = title ? `*${title}*\n\n${content}` : content;
        return this.sendMetaMessage(phoneNumber, text);
    }
    async sendMetaMessage(to, body) {
        if (!this.token || !this.phoneNumberId) {
            return {
                success: false,
                error: "Meta WhatsApp credentials not configured in environment or request.",
            };
        }
        try {
            const cleanPhone = to.replace(/\+/g, "").trim();
            const payload = {
                messaging_product: "whatsapp",
                to: cleanPhone,
                type: "text",
                text: { body },
            };
            const response = await fetch(`https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(6000),
            });
            const json = (await response.json());
            if (!response.ok) {
                const errorMsg = json.error?.message || "Failed to send message via Meta WhatsApp API";
                loggers_1.logger.error(`Meta WhatsApp error: ${errorMsg}`);
                return { success: false, error: errorMsg };
            }
            return { success: true, messageId: json.messages?.[0]?.id };
        }
        catch (err) {
            loggers_1.logger.error("Meta WhatsApp Exception:", err);
            return { success: false, error: err?.message || String(err) };
        }
    }
}
exports.MetaCloudWhatsAppService = MetaCloudWhatsAppService;
function createWhatsAppService() {
    switch (env_1.WHATSAPP_PROVIDER) {
        case "twilio":
            return new TwilioWhatsAppService();
        case "meta":
            return new MetaCloudWhatsAppService();
        case "dev":
        default:
            return new DevWhatsAppService();
    }
}
exports.whatsappService = createWhatsAppService();
