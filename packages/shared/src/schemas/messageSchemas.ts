import { z } from "zod";
import { phoneRegex } from "./authSchemas";

export const deliveryChannelEnum = z.enum(["EMAIL", "WHATSAPP", "BOTH"]);

export const createMessageSchema = z
  .object({
    title: z.string().max(200).optional(),
    content: z.string().min(1, "Message content cannot be empty").max(5000),
    recipientName: z.string().max(100).optional(),
    recipientEmail: z.string().email("Invalid recipient email").optional().or(z.literal("")),
    recipientPhone: z
      .string()
      .regex(phoneRegex, "Recipient phone must be in E.164 format (e.g. +14155552671)")
      .optional()
      .or(z.literal("")),
    deliveryChannel: deliveryChannelEnum.default("EMAIL"),
    triggerAfterDays: z.number().int().positive("Trigger days must be a positive integer").optional(),
  })
  .refine(
    (data) => {
      if (data.deliveryChannel === "EMAIL" || data.deliveryChannel === "BOTH") {
        return !!data.recipientEmail;
      }
      return true;
    },
    {
      message: "Recipient email is required when delivery channel is EMAIL or BOTH",
      path: ["recipientEmail"],
    },
  )
  .refine(
    (data) => {
      if (data.deliveryChannel === "WHATSAPP" || data.deliveryChannel === "BOTH") {
        return !!data.recipientPhone;
      }
      return true;
    },
    {
      message: "Recipient phone is required when delivery channel is WHATSAPP or BOTH",
      path: ["recipientPhone"],
    },
  );

export const updateMessageSchema = z
  .object({
    title: z.string().max(200).optional(),
    content: z.string().min(1).max(5000).optional(),
    recipientName: z.string().max(100).optional(),
    recipientEmail: z.string().email().optional().or(z.literal("")),
    recipientPhone: z
      .string()
      .regex(phoneRegex, "Recipient phone must be in E.164 format")
      .optional()
      .or(z.literal("")),
    deliveryChannel: deliveryChannelEnum.optional(),
    triggerAfterDays: z.number().int().positive().optional(),
  });

export const testMessageServiceEnum = z.enum([
  "smtp",
  "email",
  "twilio",
  "meta",
  "dev",
  "expo",
  "push",
  "all",
]);

export const testMessageSchema = z.object({
  service: testMessageServiceEnum.optional(),
  channel: deliveryChannelEnum.optional(),
  twilioMode: z.enum(["whatsapp", "sms"]).optional(),
  sync: z.boolean().optional(),
  recipientEmail: z.string().email("Invalid recipient email").optional().or(z.literal("")),
  recipientPhone: z
    .string()
    .regex(phoneRegex, "Recipient phone must be in E.164 format (e.g. +14155552671)")
    .optional()
    .or(z.literal("")),
  deviceToken: z.string().optional().or(z.literal("")),
  title: z.string().max(200).optional(),
  content: z.string().max(5000).optional(),
  // Optional credential overrides for live diagnostics
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioFromNumber: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().positive().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpSecure: z.boolean().optional(),
});

