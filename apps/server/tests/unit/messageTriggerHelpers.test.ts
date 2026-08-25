import { describe, expect, it } from "vitest";
import { shouldTriggerMessage } from "../../src/helpers/messageTriggerHelpers";

describe("shouldTriggerMessage", () => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  it("should return false if neither message nor user has a triggerAfterDays set", () => {
    const message = { triggerAfterDays: null };
    const user = {
      lastLoginAt: new Date(Date.now() - 400 * ONE_DAY_MS),
      defaultTriggerAfterDays: null,
    };

    expect(shouldTriggerMessage(message, user)).toBe(false);
  });

  it("should return false if days passed since last login is less than triggerAfterDays", () => {
    const message = { triggerAfterDays: 30 };
    const user = {
      lastLoginAt: new Date(Date.now() - 10 * ONE_DAY_MS),
      defaultTriggerAfterDays: 365,
    };

    expect(shouldTriggerMessage(message, user)).toBe(false);
  });

  it("should return true if days passed exceeds message's custom triggerAfterDays", () => {
    const message = { triggerAfterDays: 30 };
    const user = {
      lastLoginAt: new Date(Date.now() - 35 * ONE_DAY_MS),
      defaultTriggerAfterDays: 365,
    };

    expect(shouldTriggerMessage(message, user)).toBe(true);
  });

  it("should fall back to user's defaultTriggerAfterDays if message triggerAfterDays is null", () => {
    const message = { triggerAfterDays: null };
    const user = {
      lastLoginAt: new Date(Date.now() - 40 * ONE_DAY_MS),
      defaultTriggerAfterDays: 30,
    };

    expect(shouldTriggerMessage(message, user)).toBe(true);
  });

  it("should return false if days passed is less than user's defaultTriggerAfterDays", () => {
    const message = { triggerAfterDays: null };
    const user = {
      lastLoginAt: new Date(Date.now() - 15 * ONE_DAY_MS),
      defaultTriggerAfterDays: 30,
    };

    expect(shouldTriggerMessage(message, user)).toBe(false);
  });
});
