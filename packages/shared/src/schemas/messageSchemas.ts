import { z } from "zod";

export const createMessageSchema = z
  .object({
    content: z.string().min(1).max(5000),
    triggerAfterDays: z.number().int().positive().optional(),
    userId: z.number().int(),
  })
  .strict();

export const updateMessageSchema = z
  .object({
    content: z.string().min(1).max(5000),
    triggerAfterDays: z.number().int().positive().optional(),
  })
  .strict();
