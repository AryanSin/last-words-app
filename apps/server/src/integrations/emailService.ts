import dns from "dns";
import nodemailer from "nodemailer";
import { buildMessageEmail } from "../templates/emailTemplates";
import { logger } from "../utils/loggers";

// Prefer IPv4 DNS lookups to avoid TCP SYN hang on systems without IPv6 route
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore in environments where setDefaultResultOrder is unavailable
}

let transporter: nodemailer.Transporter | null = null;

export const resetTransporter = () => {
  transporter = null;
};

export const initializeEmailService = async (forceReload: boolean = false) => {
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

      transporter = nodemailer.createTransport({
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
      } as any);

      logger.info(`Initialized live SMTP transport (${smtpHost}:${port})`);
      return;
    }

    // Dev fallback: Ethereal test account
    const testAccount = await nodemailer.createTestAccount();

    logger.info(`Initialized test email transport (${testAccount.user})`);

    transporter = nodemailer.createTransport({
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
  } catch (err) {
    logger.error("Failed to initialize email transport:", err);
  }
};

export const sendEmail = async (
  to: string,
  subject: string,
  content: string,
  senderName?: string | null,
  recipientName?: string | null,
) => {
  if (!transporter) {
    await initializeEmailService();
    if (!transporter) {
      throw new Error("Email service is not initialized");
    }
  }

  const mail = buildMessageEmail(subject, content, senderName, recipientName);
  const fromAddress = process.env.SMTP_FROM || '"Last Words" <noreply@lastwords.app>';

  const info = await transporter.sendMail({
    from: fromAddress,
    to,
    subject: mail.subject,
    html: mail.html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  logger.info(`[EmailService] Message sent: ${info.messageId} | Preview: ${previewUrl}`);

  return { messageId: info.messageId, previewUrl };
};

export const verifyEmailConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!transporter) {
      await initializeEmailService();
    }
    if (!transporter) {
      return { success: false, error: "Email transporter not initialized" };
    }
    await transporter.verify();
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
};

export interface CustomEmailOptions {
  host: string;
  port?: number;
  secure?: boolean;
  user: string;
  pass: string;
  from?: string;
  to: string;
  subject: string;
  content: string;
  senderName?: string | null;
  recipientName?: string | null;
}

export const sendCustomEmail = async (options: CustomEmailOptions) => {
  const port = options.port || 587;
  const secure = options.secure ?? (port === 465);

  const customTransporter = nodemailer.createTransport({
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
  } as any);

  const mail = buildMessageEmail(options.subject, options.content, options.senderName, options.recipientName);
  const fromAddress = options.from || process.env.SMTP_FROM || `"${options.senderName || "Last Words"}" <${options.user}>`;

  const info = await customTransporter.sendMail({
    from: fromAddress,
    to: options.to,
    subject: mail.subject,
    html: mail.html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info as any);
  return { messageId: info.messageId, previewUrl };
};

