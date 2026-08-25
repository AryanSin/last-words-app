import nodemailer from "nodemailer";
import { buildMessageEmail } from "../templates/emailTemplates";
import { logger } from "../utils/loggers";

let transporter: nodemailer.Transporter;

export const initializeEmailService = async () => {
  try {
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
    });
  } catch (err) {
    logger.error("Failed to initialize Ethereal email test account:", err);
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

  const info = await transporter.sendMail({
    from: '"Last Words" <noreply@lastwords.com>',
    to,
    subject: mail.subject,
    html: mail.html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  logger.info(`[EmailService] Message sent: ${info.messageId} | Preview: ${previewUrl}`);

  return { messageId: info.messageId, previewUrl };
};
