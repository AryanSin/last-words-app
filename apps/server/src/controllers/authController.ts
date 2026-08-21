import { AuthProvider } from "@prisma/client";
import {
  googleAuthType,
  loginUserType,
  registerUserType,
  sendOtpType,
  verifyOtpType,
} from "@shared/types/apiTypes";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { toUserResponseDtoMinimal } from "../dto/userDto";
import googleAuthService from "../integrations/googleAuthService";
import { whatsappService } from "../integrations/whatsappService";
import authServices from "../services/authServices";
import otpService from "../services/otpService";
import userServices from "../services/userServices";
import AppError from "../utils/AppError";
import { generateToken } from "../utils/authUtility";
import successResponse from "../utils/successResponse";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name, email, password } = req.body as registerUserType;

  const existingUser = await userServices.getUserByEmail(email);
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await authServices.createUser({
    name,
    email,
    password: hashedPassword,
    authProviders: [AuthProvider.LOCAL],
    lastLoginAt: new Date(),
  });

  const token = generateToken(user);

  return successResponse(
    res,
    { token, user: toUserResponseDtoMinimal(user) },
    201,
  );
};

export const handleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.parsedData as loginUserType;

  const user = await userServices.getUserByEmail(email);

  if (!user || !user.password) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatched = await bcrypt.compare(password, user.password);

  if (!passwordMatched) {
    throw new AppError("Invalid email or password", 401);
  }

  const updatedUser = await userServices.touchLastLogin(user.id);
  const token = generateToken(updatedUser);

  return successResponse(
    res,
    { token, user: toUserResponseDtoMinimal(updatedUser) },
    200,
  );
};

export const handleGoogleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { idToken } = req.parsedData as googleAuthType;

  const googleUserInfo = await googleAuthService.verifyIdToken(idToken);
  const user = await authServices.findOrCreateGoogleUser(googleUserInfo);
  const token = generateToken(user);

  return successResponse(
    res,
    { token, user: toUserResponseDtoMinimal(user) },
    200,
  );
};

export const sendWhatsAppOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { phoneNumber } = req.parsedData as sendOtpType;

  const { otp, expiresInSeconds } = await otpService.generateOtp(phoneNumber);

  const sendResult = await whatsappService.sendOtp(phoneNumber, otp);

  if (!sendResult.success) {
    throw new AppError(
      sendResult.error || "Failed to send WhatsApp OTP. Please try again later.",
      502,
    );
  }

  return successResponse(
    res,
    {
      message: "WhatsApp verification code sent successfully.",
      expiresInSeconds,
    },
    200,
  );
};

export const verifyWhatsAppOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { phoneNumber, otp, name } = req.parsedData as verifyOtpType;

  await otpService.verifyOtp(phoneNumber, otp);

  const user = await authServices.findOrCreateWhatsAppUser(phoneNumber, name);
  const token = generateToken(user);

  return successResponse(
    res,
    { token, user: toUserResponseDtoMinimal(user) },
    200,
  );
};

export const handleCheckIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const updatedUser = await userServices.touchLastLogin(userId);

  return successResponse(
    res,
    {
      message: "Check-in successful! Inactivity timer has been refreshed.",
      lastLoginAt: updatedUser.lastLoginAt,
    },
    200,
  );
};
