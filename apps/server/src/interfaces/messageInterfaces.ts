import { Prisma } from "@prisma/client";

export type minimalMessageWithUser = Prisma.MessageGetPayload<{
  select: {
    id: true;
    title: true;
    content: true;
    recipientName: true;
    recipientEmail: true;
    recipientPhone: true;
    deliveryChannel: true;
    triggerAfterDays: true;
    failedAttempts: true;
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        phoneNumber: true;
        lastLoginAt: true;
        defaultTriggerAfterDays: true;
      };
    };
  };
}>;
