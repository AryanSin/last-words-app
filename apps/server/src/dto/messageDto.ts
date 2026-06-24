import { Message } from "@prisma/client";
import { messageDto, messageWithStatusDto } from "@shared/types/messageTypes";

export const toMessageResponseDto = (message: Message) => {
  return {
    id: message.id,
    content: message.content,
    userId: message.userId,
    createdAt: message.createdAt,
    triggerAfterDays: message.triggerAfterDays,
  } as messageDto;
};

export const toMessageResponseDtoWithMessageStatus = (message: Message) => {
  return {
    id: message.id,
    content: message.content,
    userId: message.userId,
    createdAt: message.createdAt,
    triggerAfterDays: message.triggerAfterDays,
    sentAt: message.sentAt,
    failedAttempts: message.failedAttempts,
    lastError: message.lastError,
    status: message.status,
  } as messageWithStatusDto;
};
