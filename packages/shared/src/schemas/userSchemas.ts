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
