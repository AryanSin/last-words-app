"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMessageResponseDtoWithMessageStatus = exports.toMessageResponseDto = exports.toDeliveryEventDto = void 0;
const toDeliveryEventDto = (event) => {
    return {
        id: event.id,
        messageId: event.messageId,
        channel: event.channel,
        recipient: event.recipient,
        success: event.success,
        error: event.error,
        createdAt: event.createdAt,
    };
};
exports.toDeliveryEventDto = toDeliveryEventDto;
const toMessageResponseDto = (message) => {
    return {
        id: message.id,
        title: message.title,
        content: message.content,
        recipientName: message.recipientName,
        recipientEmail: message.recipientEmail,
        recipientPhone: message.recipientPhone,
        deliveryChannel: message.deliveryChannel,
        userId: message.userId,
        triggerAfterDays: message.triggerAfterDays,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
    };
};
exports.toMessageResponseDto = toMessageResponseDto;
const toMessageResponseDtoWithMessageStatus = (message) => {
    return {
        ...(0, exports.toMessageResponseDto)(message),
        sentAt: message.sentAt,
        failedAttempts: message.failedAttempts,
        lastError: message.lastError,
        status: message.status,
        deliveryEvents: message.deliveryEvents?.map(exports.toDeliveryEventDto),
        daysRemaining: message.daysRemaining,
    };
};
exports.toMessageResponseDtoWithMessageStatus = toMessageResponseDtoWithMessageStatus;
