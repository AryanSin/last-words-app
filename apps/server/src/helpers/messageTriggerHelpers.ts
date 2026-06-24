import { User } from "@prisma/client";
import { minimalMessageWithUser } from "../interfaces/messageInterfaces";

export const shouldTriggerMessage = (
  message: minimalMessageWithUser,
  user: Omit<User, "password" | "name" | "createdAt">,
) => {
  const triggerAfterDays =
    message.triggerAfterDays ?? user.defaultTriggerAfterDays;

  if (!triggerAfterDays) return false;

  const daysPassedSinceLastLogin = Math.floor(
    (Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  return daysPassedSinceLastLogin > triggerAfterDays;
};
