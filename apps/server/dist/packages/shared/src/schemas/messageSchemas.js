"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testMessageSchema = exports.testMessageServiceEnum = exports.updateMessageSchema = exports.createMessageSchema = exports.deliveryChannelEnum = void 0;
const zod_1 = require("zod");
const authSchemas_1 = require("./authSchemas");
exports.deliveryChannelEnum = zod_1.z.enum(["EMAIL", "WHATSAPP", "BOTH"]);
exports.createMessageSchema = zod_1.z
    .object({
    title: zod_1.z.string().max(200).optional(),
    content: zod_1.z.string().min(1, "Message content cannot be empty").max(5000),
    recipientName: zod_1.z.string().max(100).optional(),
    recipientEmail: zod_1.z.string().email("Invalid recipient email").optional().or(zod_1.z.literal("")),
    recipientPhone: zod_1.z
        .string()
        .regex(authSchemas_1.phoneRegex, "Recipient phone must be in E.164 format (e.g. +14155552671)")
        .optional()
        .or(zod_1.z.literal("")),
    deliveryChannel: exports.deliveryChannelEnum.default("EMAIL"),
    triggerAfterDays: zod_1.z.number().int().positive("Trigger days must be a positive integer").optional(),
})
    .refine((data) => {
    if (data.deliveryChannel === "EMAIL" || data.deliveryChannel === "BOTH") {
        return !!data.recipientEmail;
    }
    return true;
}, {
    message: "Recipient email is required when delivery channel is EMAIL or BOTH",
    path: ["recipientEmail"],
})
    .refine((data) => {
    if (data.deliveryChannel === "WHATSAPP" || data.deliveryChannel === "BOTH") {
        return !!data.recipientPhone;
    }
    return true;
}, {
    message: "Recipient phone is required when delivery channel is WHATSAPP or BOTH",
    path: ["recipientPhone"],
});
exports.updateMessageSchema = zod_1.z
    .object({
    title: zod_1.z.string().max(200).optional(),
    content: zod_1.z.string().min(1).max(5000).optional(),
    recipientName: zod_1.z.string().max(100).optional(),
    recipientEmail: zod_1.z.string().email().optional().or(zod_1.z.literal("")),
    recipientPhone: zod_1.z
        .string()
        .regex(authSchemas_1.phoneRegex, "Recipient phone must be in E.164 format")
        .optional()
        .or(zod_1.z.literal("")),
    deliveryChannel: exports.deliveryChannelEnum.optional(),
    triggerAfterDays: zod_1.z.number().int().positive().optional(),
});
exports.testMessageServiceEnum = zod_1.z.enum([
    "smtp",
    "email",
    "twilio",
    "meta",
    "dev",
    "expo",
    "push",
    "all",
]);
exports.testMessageSchema = zod_1.z.object({
    service: exports.testMessageServiceEnum.optional(),
    channel: exports.deliveryChannelEnum.optional(),
    twilioMode: zod_1.z.enum(["whatsapp", "sms"]).optional(),
    sync: zod_1.z.boolean().optional(),
    recipientEmail: zod_1.z.string().email("Invalid recipient email").optional().or(zod_1.z.literal("")),
    recipientPhone: zod_1.z
        .string()
        .regex(authSchemas_1.phoneRegex, "Recipient phone must be in E.164 format (e.g. +14155552671)")
        .optional()
        .or(zod_1.z.literal("")),
    deviceToken: zod_1.z.string().optional().or(zod_1.z.literal("")),
    title: zod_1.z.string().max(200).optional(),
    content: zod_1.z.string().max(5000).optional(),
    // Optional credential overrides for live diagnostics
    twilioAccountSid: zod_1.z.string().optional(),
    twilioAuthToken: zod_1.z.string().optional(),
    twilioFromNumber: zod_1.z.string().optional(),
    smtpHost: zod_1.z.string().optional(),
    smtpPort: zod_1.z.number().int().positive().optional(),
    smtpUser: zod_1.z.string().optional(),
    smtpPass: zod_1.z.string().optional(),
    smtpSecure: zod_1.z.boolean().optional(),
});
