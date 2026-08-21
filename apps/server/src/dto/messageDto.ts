import { DeliveryEvent, Message } from "@prisma/client";
import {
  DeliveryChannelType,
  DeliveryEventDto,
  messageDto,
  messageWithStatusDto,
} from "@shared/types/messageTypes";

export const toDeliveryEventDto = (event: DeliveryEvent): DeliveryEventDto => {
  return {
    id: event.id,
    messageId: event.messageId,
    channel: event.channel as DeliveryChannelType,
    recipient: event.recipient,
    success: event.success,
    error: event.error,
    createdAt: event.createdAt,
  };
};

export const toMessageResponseDto = (message: Message): messageDto => {
  return {
    id: message.id,
    title: message.title,
    content: message.content,
    recipientName: message.recipientName,
    recipientEmail: message.recipientEmail,
    recipientPhone: message.recipientPhone,
    deliveryChannel: message.deliveryChannel as DeliveryChannelType,
    userId: message.userId,
    triggerAfterDays: message.triggerAfterDays,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};

export const toMessageResponseDtoWithMessageStatus = (
  message: Message & { deliveryEvents?: DeliveryEvent[] },
): messageWithStatusDto => {
  return {
    ...toMessageResponseDto(message),
    sentAt: message.sentAt,
    failedAttempts: message.failedAttempts,
    lastError: message.lastError,
    status: message.status as any,
    deliveryEvents: message.deliveryEvents?.map(toDeliveryEventDto),
  };
};
