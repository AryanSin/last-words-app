import z from "zod";
import { loginUserSchema, registerUserSchema } from "../schemas/authSchemas";
import { userDefaultTriggerUpdateSchema } from "../schemas/userSchemas";
import {
  createMessageSchema,
  updateMessageSchema,
} from "../schemas/messageSchemas";
import { paginationSchema } from "../schemas/paginationSchema";

export type registerUserType = z.infer<typeof registerUserSchema>;
export type loginUserType = z.infer<typeof loginUserSchema>;

export type userDefaultTriggerUpdateType = z.infer<
  typeof userDefaultTriggerUpdateSchema
>;

export type messageCreationBodyType = z.infer<typeof createMessageSchema>;
export type updateMessageBodyType = z.infer<typeof updateMessageSchema>;

export type paginationBodyType = z.infer<typeof paginationSchema>;
