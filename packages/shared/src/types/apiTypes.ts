import z from "zod";
import {
  googleAuthSchema,
  loginUserSchema,
  refreshTokenSchema,
  registerUserSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "../schemas/authSchemas";
import {
  createMessageSchema,
  testMessageSchema,
  updateMessageSchema,
} from "../schemas/messageSchemas";
import { paginationSchema } from "../schemas/paginationSchema";
import {
  deletePushTokenSchema,
  registerPushTokenSchema,
  updateUserProfileSchema,
  userCheckInSchema,
  userDefaultTriggerUpdateSchema,
  verifyPasswordSchema,
} from "../schemas/userSchemas";

export type registerUserType = z.infer<typeof registerUserSchema>;
export type loginUserType = z.infer<typeof loginUserSchema>;
export type googleAuthType = z.infer<typeof googleAuthSchema>;
export type sendOtpType = z.infer<typeof sendOtpSchema>;
export type verifyOtpType = z.infer<typeof verifyOtpSchema>;
export type refreshTokenType = z.infer<typeof refreshTokenSchema>;

export type userDefaultTriggerUpdateType = z.infer<
  typeof userDefaultTriggerUpdateSchema
>;
export type updateUserProfileType = z.infer<typeof updateUserProfileSchema>;

export type registerPushTokenType = z.infer<typeof registerPushTokenSchema>;
export type deletePushTokenType = z.infer<typeof deletePushTokenSchema>;
export type userCheckInType = z.infer<typeof userCheckInSchema>;
export type verifyPasswordType = z.infer<typeof verifyPasswordSchema>;

export type messageCreationBodyType = z.infer<typeof createMessageSchema>;
export type updateMessageBodyType = z.infer<typeof updateMessageSchema>;
export type testMessageBodyType = z.infer<typeof testMessageSchema>;

export type paginationBodyType = z.infer<typeof paginationSchema>;
