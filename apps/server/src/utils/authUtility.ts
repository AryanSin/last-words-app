import { User } from "@prisma/client";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";
import redis from "../config/redis";
import AppError from "./AppError";

// Mobile-friendly token expiration: 7 days for Access Token, 30 days for Refresh Token
export const ACCESS_TOKEN_EXPIRY = "7d";
export const ACCESS_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
export const REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type AuthUserPayload = Pick<User, "id"> &
  Partial<Pick<User, "email" | "phoneNumber" | "name">>;

export const generateAccessToken = (user: AuthUserPayload): string => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
};

export const generateTokens = async (
  user: AuthUserPayload,
): Promise<AuthTokens> => {
  const accessToken = generateAccessToken(user);
  const refreshToken = crypto.randomBytes(40).toString("hex");

  const redisKey = `refresh_token:${refreshToken}`;
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    createdAt: new Date().toISOString(),
  });

  await redis.set(redisKey, payload, "EX", REFRESH_TOKEN_EXPIRY_SECONDS);
  await redis.sadd(`user_refresh_tokens:${user.id}`, refreshToken);

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
  };
};

export const rotateRefreshToken = async (
  oldRefreshToken: string,
): Promise<AuthTokens & { user: { id: number; email?: string; phoneNumber?: string } }> => {
  const redisKey = `refresh_token:${oldRefreshToken}`;
  const data = await redis.get(redisKey);

  if (!data) {
    throw new AppError("Invalid, revoked, or expired refresh token", 401);
  }

  const user = JSON.parse(data) as {
    id: number;
    email?: string;
    phoneNumber?: string;
  };

  // Revoke the old refresh token (atomic rotation)
  await redis.del(redisKey);
  await redis.srem(`user_refresh_tokens:${user.id}`, oldRefreshToken);

  // Generate a fresh token pair
  const newTokens = await generateTokens(user);

  return {
    ...newTokens,
    user,
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
