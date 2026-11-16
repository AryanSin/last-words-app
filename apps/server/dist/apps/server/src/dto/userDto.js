"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUserResponseDtoWithMessages = exports.toUserResponseDtoMinimal = exports.toUserResponseDto = void 0;
const messageDto_1 = require("./messageDto");
const toUserResponseDto = (user) => {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        avatarUrl: user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        authProviders: user.authProviders,
        defaultTriggerAfterDays: user.defaultTriggerAfterDays,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
    };
};
exports.toUserResponseDto = toUserResponseDto;
const toUserResponseDtoMinimal = (user) => {
    return (0, exports.toUserResponseDto)(user);
};
exports.toUserResponseDtoMinimal = toUserResponseDtoMinimal;
const toUserResponseDtoWithMessages = (user) => {
    return {
        ...(0, exports.toUserResponseDto)(user),
        messages: user.messages?.map(messageDto_1.toMessageResponseDtoWithMessageStatus) || [],
    };
};
exports.toUserResponseDtoWithMessages = toUserResponseDtoWithMessages;
