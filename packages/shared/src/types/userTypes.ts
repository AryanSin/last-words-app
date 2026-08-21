import { messageWithStatusDto } from "./messageTypes";

export type AuthProviderType = "LOCAL" | "GOOGLE" | "WHATSAPP";

export interface userDto {
  id: number;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  authProviders: AuthProviderType[];
  defaultTriggerAfterDays: number | null;
  lastLoginAt?: Date | string;
  createdAt?: Date | string;
}

export interface userWithMessageDto extends userDto {
  messages: messageWithStatusDto[];
}
