export interface messageDto {
  id: number;
  content: string;
  userId: number;
  createdAt: Date;
  triggerAfterDays: number;
}

export interface messageWithStatusDto {
  id: number;
  content: string;
  userId: number;
  createdAt: Date;
  triggerAfterDays: number;
  sentAt: Date;
  failedAttempts: number;
  lastError: string;
  status: "PENDING" | "SENT" | "FAILED";
}
