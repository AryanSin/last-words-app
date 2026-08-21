import {
  META_PHONE_NUMBER_ID,
  META_WHATSAPP_TOKEN,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_WHATSAPP_NUMBER,
  WHATSAPP_PROVIDER,
} from "../config/env";
import { logger } from "../utils/loggers";

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IWhatsAppService {
  sendOtp(phoneNumber: string, otp: string): Promise<WhatsAppSendResult>;
  sendMessage(
    phoneNumber: string,
    content: string,
    title?: string,
  ): Promise<WhatsAppSendResult>;
}

/**
 * Development Mock WhatsApp Service - logs formatted messages to console & loggers.
 */
class DevWhatsAppService implements IWhatsAppService {
  async sendOtp(phoneNumber: string, otp: string): Promise<WhatsAppSendResult> {
    const banner = `
================== [WHATSAPP DEV MOCK - OTP] ==================
To: ${phoneNumber}
Message: Your Last Words verification code is: ${otp}. Valid for 5 minutes.
===============================================================`;
    console.log(banner);
    logger.info(`[DevWhatsApp] OTP sent to ${phoneNumber}: ${otp}`);
    return { success: true, messageId: `mock-otp-${Date.now()}` };
  }

  async sendMessage(
    phoneNumber: string,
    content: string,
    title?: string,
  ): Promise<WhatsAppSendResult> {
    const banner = `
============== [WHATSAPP DEV MOCK - DISPATCH] ================
To: ${phoneNumber}
Title: ${title || "Important message from Last Words"}
Body:
${content}
===============================================================`;
    console.log(banner);
    logger.info(`[DevWhatsApp] Message delivered to ${phoneNumber}`);
    return { success: true, messageId: `mock-msg-${Date.now()}` };
  }
}

/**
 * Twilio WhatsApp Service implementation.
 */
class TwilioWhatsAppService implements IWhatsAppService {
  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`;
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<WhatsAppSendResult> {
    const text = `Your Last Words verification code is: ${otp}. It will expire in 5 minutes.`;
    return this.sendTwilioMessage(phoneNumber, text);
  }

  async sendMessage(
    phoneNumber: string,
    content: string,
    title?: string,
  ): Promise<WhatsAppSendResult> {
    const text = title ? `*${title}*\n\n${content}` : content;
    return this.sendTwilioMessage(phoneNumber, text);
  }

  private async sendTwilioMessage(
    to: string,
    body: string,
  ): Promise<WhatsAppSendResult> {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
      return {
        success: false,
        error: "Twilio WhatsApp credentials not configured in environment.",
      };
    }

    try {
      const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
      const formattedFrom = TWILIO_WHATSAPP_NUMBER.startsWith("whatsapp:")
        ? TWILIO_WHATSAPP_NUMBER
        : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;

      const formData = new URLSearchParams();
      formData.append("To", formattedTo);
      formData.append("From", formattedFrom);
      formData.append("Body", body);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: this.getAuthHeader(),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        },
      );

      const json = (await response.json()) as any;

      if (!response.ok) {
        const errorMsg = json.message || "Failed to send WhatsApp message via Twilio";
        logger.error(`Twilio WhatsApp error: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }

      return { success: true, messageId: json.sid };
    } catch (err: any) {
      logger.error("Twilio WhatsApp Exception:", err);
      return { success: false, error: err?.message || String(err) };
    }
  }
}

/**
 * Meta Cloud WhatsApp API implementation.
 */
class MetaCloudWhatsAppService implements IWhatsAppService {
  async sendOtp(phoneNumber: string, otp: string): Promise<WhatsAppSendResult> {
    const text = `Your Last Words verification code is: ${otp}. Valid for 5 minutes.`;
    return this.sendMetaMessage(phoneNumber, text);
  }

  async sendMessage(
    phoneNumber: string,
    content: string,
    title?: string,
  ): Promise<WhatsAppSendResult> {
    const text = title ? `*${title}*\n\n${content}` : content;
    return this.sendMetaMessage(phoneNumber, text);
  }

  private async sendMetaMessage(to: string, body: string): Promise<WhatsAppSendResult> {
    if (!META_WHATSAPP_TOKEN || !META_PHONE_NUMBER_ID) {
      return {
        success: false,
        error: "Meta WhatsApp credentials not configured in environment.",
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

      const response = await fetch(
        `https://graph.facebook.com/v20.0/${META_PHONE_NUMBER_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${META_WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const json = (await response.json()) as any;

      if (!response.ok) {
        const errorMsg = json.error?.message || "Failed to send message via Meta WhatsApp API";
        logger.error(`Meta WhatsApp error: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }

      return { success: true, messageId: json.messages?.[0]?.id };
    } catch (err: any) {
      logger.error("Meta WhatsApp Exception:", err);
      return { success: false, error: err?.message || String(err) };
    }
  }
}

function createWhatsAppService(): IWhatsAppService {
  switch (WHATSAPP_PROVIDER) {
    case "twilio":
      return new TwilioWhatsAppService();
    case "meta":
      return new MetaCloudWhatsAppService();
    case "dev":
    default:
      return new DevWhatsAppService();
  }
}

export const whatsappService = createWhatsAppService();
