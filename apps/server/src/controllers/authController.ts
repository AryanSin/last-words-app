import { AuthProvider } from "@prisma/client";
import {
  googleAuthType,
  loginUserType,
  refreshTokenType,
  registerUserType,
  sendOtpType,
  verifyOtpType,
} from "@shared/types/apiTypes";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import redis from "../config/redis";
import { toUserResponseDtoMinimal } from "../dto/userDto";
import googleAuthService from "../integrations/googleAuthService";
import { whatsappService } from "../integrations/whatsappService";
import authServices from "../services/authServices";
import otpService from "../services/otpService";
import userServices from "../services/userServices";
import AppError from "../utils/AppError";
import { authLogger } from "../utils/loggers";
import {
  generateTokens,
  revokeRefreshToken,
  rotateRefreshToken,
} from "../utils/authUtility";
import successResponse from "../utils/successResponse";

export const getClientPlatform = (req: Request): string => {
  const headerPlatform = req.headers["x-client-platform"] as string | undefined;
  if (headerPlatform) return headerPlatform;
  const bodyPlatform = (req.body as any)?.platform as string | undefined;
  if (bodyPlatform) return bodyPlatform;
  const userAgent = (req.headers["user-agent"] || "").toLowerCase();
  if (
    userAgent.includes("okhttp") ||
    userAgent.includes("darwin") ||
    userAgent.includes("cfnetwork") ||
    userAgent.includes("expo")
  ) {
    return "mobile";
  }
  return "web";
};

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

  const platform = getClientPlatform(req);
  const tokens = await generateTokens(user, platform);

  return successResponse(
    res,
    {
      ...tokens,
      user: toUserResponseDtoMinimal(user),
    },
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
  const platform = getClientPlatform(req);
  const tokens = await generateTokens(updatedUser, platform);

  return successResponse(
    res,
    {
      ...tokens,
      user: toUserResponseDtoMinimal(updatedUser),
    },
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
  const platform = getClientPlatform(req);
  const tokens = await generateTokens(user, platform);

  return successResponse(
    res,
    {
      ...tokens,
      user: toUserResponseDtoMinimal(user),
    },
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
  const platform = getClientPlatform(req);
  const tokens = await generateTokens(user, platform);

  return successResponse(
    res,
    {
      ...tokens,
      user: toUserResponseDtoMinimal(user),
    },
    200,
  );
};

export const handleRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { refreshToken } = req.parsedData as refreshTokenType;
  const platform = getClientPlatform(req);
  const result = await rotateRefreshToken(refreshToken, platform);

  return successResponse(
    res,
    {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    },
    200,
  );
};

export const handleLogout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { refreshToken } = req.parsedData as refreshTokenType;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  // Blacklist the active access token in Redis if provided
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader && authHeader.split(" ")[1];
  if (accessToken) {
    try {
      const decoded = jwt.decode(accessToken) as any;
      const ttl = decoded?.exp
        ? Math.max(1, decoded.exp - Math.floor(Date.now() / 1000))
        : 86400 * 30;
      await redis.set(`revoked_token:${accessToken}`, "1", "EX", ttl);
    } catch {}
  }

  return successResponse(
    res,
    { message: "Logged out successfully. Tokens revoked." },
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

  const { biometricVerified, authMethod } = (req.body || {}) as {
    biometricVerified?: boolean;
    authMethod?: string;
  };

  const updatedUser = await userServices.touchLastLogin(userId);

  if (biometricVerified) {
    authLogger(`User ${userId} confirmed heartbeat via biometric authentication`);
  }

  return successResponse(
    res,
    {
      message: biometricVerified
        ? "Biometric check-in verified! Inactivity timer refreshed."
        : "Check-in successful! Inactivity timer has been refreshed.",
      lastLoginAt: updatedUser.lastLoginAt,
      biometricVerified: Boolean(biometricVerified),
      authMethod: authMethod || (biometricVerified ? "BIOMETRIC" : "MANUAL"),
    },
    200,
  );
};

