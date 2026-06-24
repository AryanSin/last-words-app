import { Prisma } from "@prisma/client";

export type Message = {
  id: number;
  userId: number;
  content: string;
  createdAt: Date;
};

export type messagesWithUser = Prisma.MessageGetPayload<{
  include: { user: true };
}>;

export type messagesWithSafeUser = Prisma.MessageGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        lastLoginAt: true;
        defaultTriggerAfterDays: true;
      };
    };
  };
}>;

export type minimalMessageWithUser = Prisma.MessageGetPayload<{
  select: {
    id: true;
    content: true;
    triggerAfterDays: true;
    failedAttempts: true;
    user: {
      select: {
        id: true;
        email: true;
        lastLoginAt: true;
        defaultTriggerAfterDays: true;
      };
    };
  };
}>;
