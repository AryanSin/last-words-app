import { z } from "zod";

const passwordSchema = z
  .string()
  .regex(RegExp(`^[A-Za-z0-9@$!%*?&]{8,}$`), {
    error: "Password must be atleast 8 characters long!",
  })
  .regex(RegExp(`^(?=.*[a-z])`), {
    error: "Password must have at least one Lowercase character!",
  })
  .regex(RegExp(`^(?=.*[A-Z])`), {
    error: "Password must have at least one Uppercase character!",
  })
  .regex(RegExp(`^(?=.*[0-9])`), {
    error: "Password must have at least one Numeric character!",
  })
  .regex(RegExp(`^(?=.*[@$!%*?&])`), {
    error: "Password must have at least one symbol!",
  });

const emailSchema = z.email();

export const registerUserSchema = z
  .object({
    name: z.string().min(2).max(50),
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const loginUserSchema = z
  .object({
    email: emailSchema,
    password: z.string().regex(RegExp(`^[A-Za-z0-9@$!%*?&]{8,}$`), {
      error: "Password must be atleast 8 characters long!",
    }),
  })
  .strict();
