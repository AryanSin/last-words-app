import {
  deletePushTokenType,
  registerPushTokenType,
  updateUserProfileType,
  userDefaultTriggerUpdateType,
  verifyPasswordType,
} from "@shared/types/apiTypes";
import { userDto } from "@shared/types/userTypes";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { toMessageResponseDtoWithMessageStatus } from "../dto/messageDto";
import { toUserResponseDtoMinimal } from "../dto/userDto";
import pushNotificationService from "../services/pushNotificationService";
import userServices from "../services/userServices";
import AppError from "../utils/AppError";
import { userLogger } from "../utils/loggers";
import { getPagination } from "../utils/pagination";
import successResponse from "../utils/successResponse";

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.user?.id);
  const user = await userServices.getUserById(id);

  if (!user) throw new AppError("User not found", 404);

  return successResponse(res, toUserResponseDtoMinimal(user), 200);
};

export const getCurrentUserSwitchStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.user?.id);
  if (!id) throw new AppError("Unauthorized", 401);

  const status = await userServices.getUserSwitchStatus(id);
  return successResponse(res, status, 200);
};

export const updateCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.user?.id);
  const data = req.parsedData as updateUserProfileType;

  // If email is changing, verify it's not taken
  if (data.email) {
    const existing = await userServices.getUserByEmail(data.email);
    if (existing && existing.id !== id) {
      throw new AppError("Email already in use by another account", 409);
    }
  }

  // If phone is changing, verify it's not taken
  if (data.phoneNumber) {
    const existing = await userServices.getUserByPhone(data.phoneNumber);
    if (existing && existing.id !== id) {
      throw new AppError("Phone number already in use by another account", 409);
    }
  }

  const updatedUser = await userServices.updateUserById(id, data);

  return successResponse(res, toUserResponseDtoMinimal(updatedUser), 200);
};

export const checkInCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.user?.id);
  const { biometricVerified, authMethod } = (req.body || {}) as {
    biometricVerified?: boolean;
    authMethod?: string;
  };
  const updatedUser = await userServices.touchLastLogin(id);

  if (biometricVerified) {
    userLogger(`User ${id} checked in with verified biometric authentication`);
  }

  return successResponse(
    res,
    {
      message: biometricVerified
        ? "Biometric check-in verified! Inactivity timer reset."
        : "Check-in successful! Inactivity timer reset.",
      lastLoginAt: updatedUser.lastLoginAt,
      biometricVerified: Boolean(biometricVerified),
      authMethod: authMethod || (biometricVerified ? "BIOMETRIC" : "MANUAL"),
    },
    200,
  );
};

export const verifyCurrentUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = Number(req.user?.id);
  const { password } = req.parsedData as verifyPasswordType;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const user = await userServices.getUserById(userId);
  if (!user || !user.password) {
    throw new AppError("Account does not have a local password configured", 400);
  }

  const passwordMatched = await bcrypt.compare(password, user.password);
  if (!passwordMatched) {
    throw new AppError("Incorrect password", 401);
  }

  userLogger(`User ${userId} successfully authenticated password for security setting change`);

  return successResponse(
    res,
    {
      verified: true,
      message: "Password verified successfully",
    },
    200,
  );
};

export const registerPushToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = Number(req.user?.id);
  const { token, platform } = req.parsedData as registerPushTokenType;

  if (!userId) throw new AppError("Unauthorized", 401);

  const device = await pushNotificationService.registerDeviceToken(
    userId,
    token,
    platform || "mobile",
  );

  return successResponse(
    res,
    {
      message: "Push token registered successfully",
      token: device.token,
      platform: device.platform,
    },
    200,
  );
};

export const removePushToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = Number(req.user?.id);
  const { token } = req.parsedData as deletePushTokenType;

  if (!userId) throw new AppError("Unauthorized", 401);

  await pushNotificationService.removeDeviceToken(userId, token);

  return successResponse(
    res,
    {
      message: "Push token removed successfully",
    },
    200,
  );
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    name,
    email,
    sort = "createdAt,desc",
  } = req.query as {
    name?: string;
    email?: string;
    sort?: string;
  };

  const users = await userServices.getUsers({
    where: {
      name: name
        ? {
            contains: String(name),
            mode: "insensitive",
          }
        : undefined,
      email: typeof email === "string" ? email : undefined,
    },
    orderBy: Object.fromEntries([sort.split(",")]),
    ...getPagination(req),
  });
  return successResponse(res, users.map(toUserResponseDtoMinimal), 200);
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);
  const user = await userServices.getUserById(id);

  if (!user) throw new AppError("User not found!", 404);

  return successResponse(res, toUserResponseDtoMinimal(user) as userDto, 200);
};

export const deleteUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);

  await userServices.deleteUserById(id);

  return res.status(204).send();
};

export const getMessagesByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);

  const messages = await userServices.getMessagesByUserId(id, {
    orderBy: {
      createdAt: "desc",
    },
    ...getPagination(req),
  });
  return successResponse(
    res,
    messages?.messages?.map(toMessageResponseDtoWithMessageStatus),
    200,
  );
};

export const getUsersCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const count = await userServices.getUsersCount();
  return successResponse(res, count, 200);
};

export const updateUserDefaultTrigger = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const data = req.parsedData as userDefaultTriggerUpdateType;
  const id = Number(req.params.id);
  const user = await userServices.updateUserById(id, data);

  return successResponse(res, toUserResponseDtoMinimal(user), 200);
};
