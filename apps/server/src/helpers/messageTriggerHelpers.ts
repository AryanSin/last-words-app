import { minimalMessageWithUser } from "../interfaces/messageInterfaces";

export const shouldTriggerMessage = (
  message: Pick<minimalMessageWithUser, "triggerAfterDays">,
  user: {
    lastLoginAt: Date | string;
    defaultTriggerAfterDays?: number | null;
  },
) => {
  const triggerAfterDays =
    message.triggerAfterDays ?? user.defaultTriggerAfterDays;

  if (!triggerAfterDays) return false;

  const daysPassedSinceLastLogin = Math.floor(
    (Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  return daysPassedSinceLastLogin > triggerAfterDays;
};
