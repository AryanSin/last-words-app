import { User } from "@prisma/client";
import { userDto, userWithMessageDto } from "@shared/types/userTypes";
import { toMessageResponseDtoWithMessageStatus } from "./messageDto";

export const toUserResponseDto = (user: User): userDto => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    authProviders: user.authProviders as any,
    defaultTriggerAfterDays: user.defaultTriggerAfterDays,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
};

export const toUserResponseDtoMinimal = (user: User): userDto => {
  return toUserResponseDto(user);
};

export const toUserResponseDtoWithMessages = (
  user: User & { messages: any[] },
): userWithMessageDto => {
  return {
    ...toUserResponseDto(user),
    messages: user.messages?.map(toMessageResponseDtoWithMessageStatus) || [],
  };
};
