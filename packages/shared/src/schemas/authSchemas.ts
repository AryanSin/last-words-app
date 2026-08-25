import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long!" })
  .regex(/[a-z]/, { message: "Password must have at least one lowercase character!" })
  .regex(/[A-Z]/, { message: "Password must have at least one uppercase character!" })
  .regex(/[0-9]/, { message: "Password must have at least one numeric character!" })
  .regex(/[@$!%*?&]/, { message: "Password must have at least one symbol (@$!%*?&)!" });

const emailSchema = z.string().email({ message: "Invalid email address" });

// E.164 format: + followed by 1 to 15 digits (e.g., +14155552671, +919876543210)
export const phoneRegex = /^\+[1-9]\d{6,14}$/;
const phoneNumberSchema = z
  .string()
  .regex(phoneRegex, { message: "Phone number must be in E.164 international format (e.g. +14155552671 or +919876543210)" });

export const registerUserSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const loginUserSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const googleAuthSchema = z
  .object({
    idToken: z.string().min(1, "Google ID token is required"),
  })
  .strict();

export const sendOtpSchema = z
  .object({
    phoneNumber: phoneNumberSchema,
  })
  .strict();

export const verifyOtpSchema = z
  .object({
    phoneNumber: phoneNumberSchema,
    otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain digits only"),
    name: z.string().min(2).max(50).optional(),
  })
  .strict();

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  })
  .strict();

