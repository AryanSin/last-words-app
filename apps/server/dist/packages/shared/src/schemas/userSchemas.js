"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPasswordSchema = exports.userCheckInSchema = exports.deletePushTokenSchema = exports.registerPushTokenSchema = exports.updateUserProfileSchema = exports.userDefaultTriggerUpdateSchema = void 0;
const zod_1 = require("zod");
const authSchemas_1 = require("./authSchemas");
exports.userDefaultTriggerUpdateSchema = zod_1.z
    .object({
    defaultTriggerAfterDays: zod_1.z.number().int().positive("Default trigger days must be a positive integer"),
})
    .strict();
exports.updateUserProfileSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(2).max(50).optional(),
    email: zod_1.z.string().email().optional(),
    phoneNumber: zod_1.z.string().regex(authSchemas_1.phoneRegex, "Phone number must be in E.164 format").optional(),
    defaultTriggerAfterDays: zod_1.z.number().int().positive().optional(),
})
    .strict();
exports.registerPushTokenSchema = zod_1.z
    .object({
    token: zod_1.z.string().min(5, "Push token cannot be empty"),
    platform: zod_1.z.enum(["ios", "android", "web", "mobile"]).optional(),
})
    .strict();
exports.deletePushTokenSchema = zod_1.z
    .object({
    token: zod_1.z.string().min(5, "Push token cannot be empty"),
})
    .strict();
exports.userCheckInSchema = zod_1.z
    .object({
    biometricVerified: zod_1.z.boolean().optional(),
    authMethod: zod_1.z.enum(["BIOMETRIC", "MANUAL", "HEARTBEAT"]).optional(),
})
    .optional();
exports.verifyPasswordSchema = zod_1.z
    .object({
    password: zod_1.z.string().min(1, "Password is required"),
})
    .strict();
