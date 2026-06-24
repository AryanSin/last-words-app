import { messageWithStatusDto } from "./messageTypes";

export interface userDto {
  id: number;
  name: string;
  email: string;
  defaultTriggerAfterDays: number;
}

export interface userWithMessageDto {
  id: number;
  name: string;
  email: string;
  defaultTriggerAfterDays: number;
  messages: messageWithStatusDto[];
}
