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

export class DevWhatsAppService implements IWhatsAppService {
  async sendOtp(phoneNumber: string, otp: string): Promise<WhatsAppSendResult> {
    console.log(`[dev-whatsapp] OTP -> ${phoneNumber}: ${otp}`);
    logger.info(`[DevWhatsApp] OTP sent to ${phoneNumber}: ${otp}`);
    return { success: true, messageId: `mock-otp-${Date.now()}` };
  }

  async sendMessage(
    phoneNumber: string,
    content: string,
    title?: string,
  ): Promise<WhatsAppSendResult> {
    console.log(`[dev-whatsapp] Message -> ${phoneNumber} | ${title || "No Title"}\n${content}`);
    logger.info(`[DevWhatsApp] Message delivered to ${phoneNumber}`);
    return { success: true, messageId: `mock-msg-${Date.now()}` };
  }
}

export class TwilioWhatsAppService implements IWhatsAppService {
  private accountSid: string;
  private authToken: string;
  private whatsappNumber: string;

  constructor(
    accountSid: string = TWILIO_ACCOUNT_SID,
    authToken: string = TWILIO_AUTH_TOKEN,
    whatsappNumber: string = TWILIO_WHATSAPP_NUMBER,
  ) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.whatsappNumber = whatsappNumber;
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`;
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

  async sendSms(
    phoneNumber: string,
    content: string,
    fromNumber?: string,
  ): Promise<WhatsAppSendResult> {
    const from = fromNumber || this.whatsappNumber.replace("whatsapp:", "");
    return this.sendTwilioRaw(phoneNumber.replace("whatsapp:", ""), content, from);
  }

  private async sendTwilioMessage(
    to: string,
    body: string,
  ): Promise<WhatsAppSendResult> {
    const formattedTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const formattedFrom = this.whatsappNumber.startsWith("whatsapp:")
      ? this.whatsappNumber
      : `whatsapp:${this.whatsappNumber}`;
    return this.sendTwilioRaw(formattedTo, body, formattedFrom);
  }

  private async sendTwilioRaw(
    to: string,
    body: string,
    from: string,
  ): Promise<WhatsAppSendResult> {
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

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: this.getAuthHeader(),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
          signal: AbortSignal.timeout(6000),
        },
      );

      const json = (await response.json()) as any;

      if (!response.ok) {
        const errorMsg = json.message || "Failed to send message via Twilio";
        logger.error(`Twilio error: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }

      return { success: true, messageId: json.sid };
    } catch (err: any) {
      logger.error("Twilio Exception:", err);
      return { success: false, error: err?.message || String(err) };
    }
  }
}

export class MetaCloudWhatsAppService implements IWhatsAppService {
  private token: string;
  private phoneNumberId: string;

  constructor(
    token: string = META_WHATSAPP_TOKEN,
    phoneNumberId: string = META_PHONE_NUMBER_ID,
  ) {
    this.token = token;
    this.phoneNumberId = phoneNumberId;
  }

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

      const response = await fetch(
        `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(6000),
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
