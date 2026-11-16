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

export interface SoonestMessageDto {
  id: number;
  title: string | null;
  recipientName: string | null;
  deliveryChannel: "EMAIL" | "WHATSAPP" | "BOTH";
  triggerAfterDays: number;
  daysRemaining: number;
}

export interface SwitchStatusDto {
  daysRemaining: number;
  daysPassed: number;
  lastLoginAt: string;
  inactivityThreshold: number;
  hasPendingMessages: boolean;
  totalMessages: number;
  pendingMessages: number;
  isUrgent: boolean;
  soonestMessage: SoonestMessageDto | null;
  isEncrypted?: boolean;
  encryptionAlgorithm?: string;
}
