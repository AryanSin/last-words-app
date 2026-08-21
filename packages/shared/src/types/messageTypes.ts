export type DeliveryChannelType = "EMAIL" | "WHATSAPP" | "BOTH";
export type MessageStatusType = "PENDING" | "SENT" | "FAILED";

export interface DeliveryEventDto {
  id: number;
  messageId: number;
  channel: DeliveryChannelType;
  recipient: string;
  success: boolean;
  error?: string | null;
  createdAt: Date | string;
}

export interface messageDto {
  id: number;
  title?: string | null;
  content: string;
  recipientName?: string | null;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  deliveryChannel: DeliveryChannelType;
  userId: number;
  triggerAfterDays?: number | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface messageWithStatusDto extends messageDto {
  sentAt?: Date | string | null;
  failedAttempts: number;
  lastError?: string | null;
  status: MessageStatusType;
  deliveryEvents?: DeliveryEventDto[];
}
