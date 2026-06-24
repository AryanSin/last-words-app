import nodemailer from "nodemailer";
import { buildMessageEmail } from "../templates/emailTemplates";

let transporter: nodemailer.Transporter;

export const initializeEmailService = async () => {
  const testAccount = await nodemailer.createTestAccount();

  console.log("ETHEREAL TEST ACCOUNT");
  console.log("EMAIL:", testAccount.user);
  console.log("PASSWORD:", testAccount.pass);

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

export const sendEmail = async (
  to: string,
  subject: string,
  content: string,
) => {
  if (!transporter) {
    throw new Error("Email service not initialized");
  }

  const mail = buildMessageEmail(subject, content);

  const info = await transporter.sendMail({
    from: '"Last Words" <noreply@lastwords.com>',
    to,
    subject: mail.subject,
    html: mail.html,
  });

  console.log("Message sent:", info.messageId);

  const previewUrl = nodemailer.getTestMessageUrl(info);

  console.log("Preview URL:", previewUrl);

  return info;
};
