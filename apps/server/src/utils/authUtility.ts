import { User } from "@prisma/client";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";
import redis from "../config/redis";
import AppError from "./AppError";

// Token expiration policies:
// Web: 7 days access token, 30 days refresh token
// Mobile: 30 days access token, 180 days sliding refresh token (extended whenever refreshed)
export const WEB_ACCESS_TOKEN_EXPIRY = "7d";
export const WEB_ACCESS_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
export const WEB_REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds

export const MOBILE_ACCESS_TOKEN_EXPIRY = "30d";
export const MOBILE_ACCESS_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds
export const MOBILE_REFRESH_TOKEN_EXPIRY_SECONDS = 180 * 24 * 60 * 60; // 180 days in seconds (sliding window)

// Backward-compatible defaults
export const ACCESS_TOKEN_EXPIRY = WEB_ACCESS_TOKEN_EXPIRY;
export const ACCESS_TOKEN_EXPIRY_SECONDS = WEB_ACCESS_TOKEN_EXPIRY_SECONDS;
export const REFRESH_TOKEN_EXPIRY_SECONDS = WEB_REFRESH_TOKEN_EXPIRY_SECONDS;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type AuthUserPayload = Pick<User, "id"> &
  Partial<Pick<User, "email" | "phoneNumber" | "name">>;

export const isMobilePlatform = (platform?: string): boolean => {
  if (!platform) return false;
  const p = platform.toLowerCase();
  return p === "ios" || p === "android" || p === "mobile";
};

export const generateAccessToken = (
  user: AuthUserPayload,
  platform?: string,
): string => {
  const isMobile = isMobilePlatform(platform);
  const expiry = isMobile ? MOBILE_ACCESS_TOKEN_EXPIRY : WEB_ACCESS_TOKEN_EXPIRY;

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      platform: isMobile ? "mobile" : "web",
    },
    JWT_SECRET,
    { expiresIn: expiry },
  );
};

export const generateTokens = async (
  user: AuthUserPayload,
  platform?: string,
): Promise<AuthTokens> => {
  const isMobile = isMobilePlatform(platform);
  const accessToken = generateAccessToken(user, platform);
  const refreshToken = crypto.randomBytes(40).toString("hex");

  const refreshTokenExpirySeconds = isMobile
    ? MOBILE_REFRESH_TOKEN_EXPIRY_SECONDS
    : WEB_REFRESH_TOKEN_EXPIRY_SECONDS;
  const accessTokenExpirySeconds = isMobile
    ? MOBILE_ACCESS_TOKEN_EXPIRY_SECONDS
    : WEB_ACCESS_TOKEN_EXPIRY_SECONDS;

  const redisKey = `refresh_token:${refreshToken}`;
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    platform: isMobile ? "mobile" : "web",
    createdAt: new Date().toISOString(),
    lastRefreshedAt: new Date().toISOString(),
  });

  await redis.set(redisKey, payload, "EX", refreshTokenExpirySeconds);
  await redis.sadd(`user_refresh_tokens:${user.id}`, refreshToken);

  return {
    accessToken,
    refreshToken,
    expiresIn: accessTokenExpirySeconds,
  };
};

export const rotateRefreshToken = async (
  oldRefreshToken: string,
  requestedPlatform?: string,
): Promise<AuthTokens & { user: { id: number; email?: string; phoneNumber?: string } }> => {
  const redisKey = `refresh_token:${oldRefreshToken}`;
  const data = await redis.get(redisKey);

  if (!data) {
    throw new AppError("Invalid, revoked, or expired refresh token", 401);
  }

  const tokenData = JSON.parse(data) as {
    id: number;
    email?: string;
    phoneNumber?: string;
    platform?: string;
  };

  const platform = requestedPlatform || tokenData.platform || "web";

  // Revoke the old refresh token (atomic rotation)
  await redis.del(redisKey);
  await redis.srem(`user_refresh_tokens:${tokenData.id}`, oldRefreshToken);

  // Generate a fresh token pair with sliding window for platform
  const newTokens = await generateTokens(tokenData, platform);

  return {
    ...newTokens,
    user: tokenData,
  };
};

export const revokeRefreshToken = async (
  refreshToken: string,
): Promise<void> => {
  const redisKey = `refresh_token:${refreshToken}`;
  const data = await redis.get(redisKey);

  if (data) {
    const user = JSON.parse(data) as { id: number };
    await redis.del(redisKey);
    await redis.srem(`user_refresh_tokens:${user.id}`, refreshToken);
  }
};

export const revokeAllUserRefreshTokens = async (
  userId: number,
): Promise<void> => {
  const userTokensKey = `user_refresh_tokens:${userId}`;
  const tokens = await redis.smembers(userTokensKey);

  if (tokens.length > 0) {
    const keysToDelete = tokens.map((token) => `refresh_token:${token}`);
    await redis.del(...keysToDelete, userTokensKey);
  }
};

// Backward-compatibility helper
export const generateToken = (user: AuthUserPayload): string => {
  return generateAccessToken(user);
};
