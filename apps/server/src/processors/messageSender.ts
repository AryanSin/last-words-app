import { DeliveryChannel } from "@prisma/client";
import { sendEmail } from "../integrations/emailService";
import { whatsappService } from "../integrations/whatsappService";
import { minimalMessageWithUser } from "../interfaces/messageInterfaces";
import { emailQueue } from "../queues/emailQueue";
import { logger, messageJobLogger } from "../utils/loggers";

const logMessageJobInfo = (argString = "", ...args: unknown[]) => {
  logger.info(argString, ...args);
  messageJobLogger(argString, ...args);
};

const logMessageJobError = (argString = "", ...args: unknown[]) => {
  logger.error(argString, ...args);
  messageJobLogger(argString, ...args);
};

export interface MessageDeliveryResult {
  id: number;
  success: boolean;
  error?: string;
  events: {
    channel: DeliveryChannel;
    recipient: string;
    success: boolean;
    error?: string;
  }[];
}

export const sendMessages = async (messages: minimalMessageWithUser[]) => {
  const results = await Promise.allSettled(
    messages.map((message) =>
      emailQueue.add(async (): Promise<MessageDeliveryResult> => {
        logMessageJobInfo(`Processing message ${message.id} for user ${message.user.id}`);

        const deliveryEvents: MessageDeliveryResult["events"] = [];
        let anySuccess = false;
        const errors: string[] = [];

        const channel = message.deliveryChannel;
        const targetEmail = message.recipientEmail || message.user.email;
        const targetPhone = message.recipientPhone || message.user.phoneNumber;

        if (channel === DeliveryChannel.EMAIL || channel === DeliveryChannel.BOTH) {
          if (targetEmail) {
            try {
              const subject = message.title || `Message from ${message.user.name || "Last Words"}`;
              await sendEmail(
                targetEmail,
                subject,
                message.content,
                message.user.name,
                message.recipientName,
              );
              deliveryEvents.push({
                channel: DeliveryChannel.EMAIL,
                recipient: targetEmail,
                success: true,
              });
              anySuccess = true;
            } catch (err: any) {
              const errorMsg = err?.message || String(err);
              errors.push(`Email error: ${errorMsg}`);
              deliveryEvents.push({
                channel: DeliveryChannel.EMAIL,
                recipient: targetEmail,
                success: false,
                error: errorMsg.slice(0, 500),
              });
            }
          } else {
            errors.push("Email channel selected but no recipient email found");
          }
        }

        if (channel === DeliveryChannel.WHATSAPP || channel === DeliveryChannel.BOTH) {
          if (targetPhone) {
            try {
              const waResult = await whatsappService.sendMessage(
                targetPhone,
                message.content,
                message.title || undefined,
              );

              if (waResult.success) {
                deliveryEvents.push({
                  channel: DeliveryChannel.WHATSAPP,
                  recipient: targetPhone,
                  success: true,
                });
                anySuccess = true;
              } else {
                const errorMsg = waResult.error || "WhatsApp delivery failed";
                errors.push(`WhatsApp error: ${errorMsg}`);
                deliveryEvents.push({
                  channel: DeliveryChannel.WHATSAPP,
                  recipient: targetPhone,
                  success: false,
                  error: errorMsg.slice(0, 500),
                });
              }
            } catch (err: any) {
              const errorMsg = err?.message || String(err);
              errors.push(`WhatsApp error: ${errorMsg}`);
              deliveryEvents.push({
                channel: DeliveryChannel.WHATSAPP,
                recipient: targetPhone,
                success: false,
                error: errorMsg.slice(0, 500),
              });
            }
          } else {
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
      }),
    ),
  );

  const successfullySentMessages: number[] = [];
  const failedMessages: { id: number; error: string; events?: MessageDeliveryResult["events"] }[] = [];
  const allEvents: { messageId: number; channel: DeliveryChannel; recipient: string; success: boolean; error?: string }[] = [];

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
    } else {
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
