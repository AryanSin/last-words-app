import { z } from "zod";
import { phoneRegex } from "./authSchemas";

export const userDefaultTriggerUpdateSchema = z
  .object({
    defaultTriggerAfterDays: z.number().int().positive("Default trigger days must be a positive integer"),
  })
  .strict();

export const updateUserProfileSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().regex(phoneRegex, "Phone number must be in E.164 format").optional(),
    defaultTriggerAfterDays: z.number().int().positive().optional(),
  })
  .strict();

export const registerPushTokenSchema = z
  .object({
    token: z.string().min(5, "Push token cannot be empty"),
    platform: z.enum(["ios", "android", "web", "mobile"]).optional(),
  })
  .strict();

export const deletePushTokenSchema = z
  .object({
    token: z.string().min(5, "Push token cannot be empty"),
  })
  .strict();

export const userCheckInSchema = z
  .object({
    biometricVerified: z.boolean().optional(),
    authMethod: z.enum(["BIOMETRIC", "MANUAL", "HEARTBEAT"]).optional(),
  })
  .optional();

export type UserCheckInType = z.infer<typeof userCheckInSchema>;

export const verifyPasswordSchema = z
  .object({
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export type VerifyPasswordType = z.infer<typeof verifyPasswordSchema>;
