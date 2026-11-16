"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.verifyOtpSchema = exports.sendOtpSchema = exports.googleAuthSchema = exports.loginUserSchema = exports.registerUserSchema = exports.phoneRegex = void 0;
const zod_1 = require("zod");
const passwordSchema = zod_1.z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .regex(/[a-z]/, { message: "Password must have at least one lowercase character!" })
    .regex(/[A-Z]/, { message: "Password must have at least one uppercase character!" })
    .regex(/[0-9]/, { message: "Password must have at least one numeric character!" })
    .regex(/[@$!%*?&]/, { message: "Password must have at least one symbol (@$!%*?&)!" });
const emailSchema = zod_1.z.string().email({ message: "Invalid email address" });
// E.164 format: + followed by 1 to 15 digits (e.g., +14155552671, +919876543210)
exports.phoneRegex = /^\+[1-9]\d{6,14}$/;
const phoneNumberSchema = zod_1.z
    .string()
    .regex(exports.phoneRegex, { message: "Phone number must be in E.164 international format (e.g. +14155552671 or +919876543210)" });
exports.registerUserSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters").max(50),
    email: emailSchema,
    password: passwordSchema,
})
    .strict();
exports.loginUserSchema = zod_1.z
    .object({
    email: emailSchema,
    password: zod_1.z.string().min(1, "Password is required"),
})
    .strict();
exports.googleAuthSchema = zod_1.z
    .object({
    idToken: zod_1.z.string().min(1, "Google ID token is required"),
})
    .strict();
exports.sendOtpSchema = zod_1.z
    .object({
    phoneNumber: phoneNumberSchema,
})
    .strict();
exports.verifyOtpSchema = zod_1.z
    .object({
    phoneNumber: phoneNumberSchema,
    otp: zod_1.z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain digits only"),
    name: zod_1.z.string().min(2).max(50).optional(),
})
    .strict();
exports.refreshTokenSchema = zod_1.z
    .object({
    refreshToken: zod_1.z.string().min(1, "Refresh token is required"),
})
    .strict();
