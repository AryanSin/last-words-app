"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMessageEmail = void 0;
const buildMessageEmail = (subject = "A message from Last Words", content, senderName, recipientName) => {
    const greeting = recipientName ? `Hello ${recipientName},` : "Hello,";
    const attribution = senderName
        ? `This message was scheduled by <strong>${senderName}</strong> to be automatically delivered to you.`
        : "This message was scheduled to be delivered to you via Last Words.";
    return {
        subject,
        html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; color: #0f172a; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Last Words</h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Automated Delivery Notification</p>
        </div>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <p style="font-size: 15px; margin-top: 0;">${greeting}</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">${attribution}</p>

          <div style="margin: 20px 0; padding: 18px; background-color: #f1f5f9; border-left: 4px solid #3b82f6; border-radius: 4px; font-size: 15px; line-height: 1.7; color: #1e293b; white-space: pre-wrap;">
            ${content}
          </div>

          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0; text-align: center;">
            Sent securely via Last Words Automated Service.
          </p>
        </div>
      </div>
    `,
    };
};
exports.buildMessageEmail = buildMessageEmail;
