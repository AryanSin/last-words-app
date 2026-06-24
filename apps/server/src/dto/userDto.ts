import { User } from "@prisma/client";
import { userDto, userWithMessageDto } from "@shared/types/userTypes";
import { UserWithMessages } from "../interfaces/userInterfaces";

export const toUserResponseDto = (user: User) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    lastLoginAt: user.lastLoginAt,
    defaultTriggerAfterDays: user.defaultTriggerAfterDays,
    createdAt: user.createdAt,
  };
};

export const toUserResponseDtoMinimal = (user: User) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    defaultTriggerAfterDays: user.defaultTriggerAfterDays,
  } as userDto;
};

export const toUserResponseDtoWithMessagesMinimal = (
  user: UserWithMessages,
) => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    defaultTriggerAfterDays: user.defaultTriggerAfterDays,
    messages: user.messages,
  } as userWithMessageDto;
};
