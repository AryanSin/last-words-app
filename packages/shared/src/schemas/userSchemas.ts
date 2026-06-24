import z from "zod";

export const userDefaultTriggerUpdateSchema = z
  .object({
    defaultTriggerAfterDays: z.number().int().positive(),
  })
  .strict();
