"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.revokeAllUserRefreshTokens = exports.revokeRefreshToken = exports.rotateRefreshToken = exports.generateTokens = exports.generateAccessToken = exports.isMobilePlatform = exports.REFRESH_TOKEN_EXPIRY_SECONDS = exports.ACCESS_TOKEN_EXPIRY_SECONDS = exports.ACCESS_TOKEN_EXPIRY = exports.MOBILE_REFRESH_TOKEN_EXPIRY_SECONDS = exports.MOBILE_ACCESS_TOKEN_EXPIRY_SECONDS = exports.MOBILE_ACCESS_TOKEN_EXPIRY = exports.WEB_REFRESH_TOKEN_EXPIRY_SECONDS = exports.WEB_ACCESS_TOKEN_EXPIRY_SECONDS = exports.WEB_ACCESS_TOKEN_EXPIRY = void 0;
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const redis_1 = __importDefault(require("../config/redis"));
const AppError_1 = __importDefault(require("./AppError"));
// Token expiration policies:
// Web: 7 days access token, 30 days refresh token
// Mobile: 30 days access token, 180 days sliding refresh token (extended whenever refreshed)
exports.WEB_ACCESS_TOKEN_EXPIRY = "7d";
exports.WEB_ACCESS_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
exports.WEB_REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds
exports.MOBILE_ACCESS_TOKEN_EXPIRY = "30d";
exports.MOBILE_ACCESS_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days in seconds
exports.MOBILE_REFRESH_TOKEN_EXPIRY_SECONDS = 180 * 24 * 60 * 60; // 180 days in seconds (sliding window)
// Backward-compatible defaults
exports.ACCESS_TOKEN_EXPIRY = exports.WEB_ACCESS_TOKEN_EXPIRY;
exports.ACCESS_TOKEN_EXPIRY_SECONDS = exports.WEB_ACCESS_TOKEN_EXPIRY_SECONDS;
exports.REFRESH_TOKEN_EXPIRY_SECONDS = exports.WEB_REFRESH_TOKEN_EXPIRY_SECONDS;
const isMobilePlatform = (platform) => {
    if (!platform)
        return false;
    const p = platform.toLowerCase();
    return p === "ios" || p === "android" || p === "mobile";
};
exports.isMobilePlatform = isMobilePlatform;
const generateAccessToken = (user, platform) => {
    const isMobile = (0, exports.isMobilePlatform)(platform);
    const expiry = isMobile ? exports.MOBILE_ACCESS_TOKEN_EXPIRY : exports.WEB_ACCESS_TOKEN_EXPIRY;
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        platform: isMobile ? "mobile" : "web",
    }, env_1.JWT_SECRET, { expiresIn: expiry });
};
exports.generateAccessToken = generateAccessToken;
const generateTokens = async (user, platform) => {
    const isMobile = (0, exports.isMobilePlatform)(platform);
    const accessToken = (0, exports.generateAccessToken)(user, platform);
    const refreshToken = crypto_1.default.randomBytes(40).toString("hex");
    const refreshTokenExpirySeconds = isMobile
        ? exports.MOBILE_REFRESH_TOKEN_EXPIRY_SECONDS
        : exports.WEB_REFRESH_TOKEN_EXPIRY_SECONDS;
    const accessTokenExpirySeconds = isMobile
        ? exports.MOBILE_ACCESS_TOKEN_EXPIRY_SECONDS
        : exports.WEB_ACCESS_TOKEN_EXPIRY_SECONDS;
    const redisKey = `refresh_token:${refreshToken}`;
    const payload = JSON.stringify({
        id: user.id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        platform: isMobile ? "mobile" : "web",
        createdAt: new Date().toISOString(),
        lastRefreshedAt: new Date().toISOString(),
    });
    await redis_1.default.set(redisKey, payload, "EX", refreshTokenExpirySeconds);
    await redis_1.default.sadd(`user_refresh_tokens:${user.id}`, refreshToken);
    return {
        accessToken,
        refreshToken,
        expiresIn: accessTokenExpirySeconds,
    };
};
exports.generateTokens = generateTokens;
const rotateRefreshToken = async (oldRefreshToken, requestedPlatform) => {
    const redisKey = `refresh_token:${oldRefreshToken}`;
    const data = await redis_1.default.get(redisKey);
    if (!data) {
        throw new AppError_1.default("Invalid, revoked, or expired refresh token", 401);
    }
    const tokenData = JSON.parse(data);
    const platform = requestedPlatform || tokenData.platform || "web";
    // Revoke the old refresh token (atomic rotation)
    await redis_1.default.del(redisKey);
    await redis_1.default.srem(`user_refresh_tokens:${tokenData.id}`, oldRefreshToken);
    // Generate a fresh token pair with sliding window for platform
    const newTokens = await (0, exports.generateTokens)(tokenData, platform);
    return {
        ...newTokens,
        user: tokenData,
    };
};
exports.rotateRefreshToken = rotateRefreshToken;
const revokeRefreshToken = async (refreshToken) => {
    const redisKey = `refresh_token:${refreshToken}`;
    const data = await redis_1.default.get(redisKey);
    if (data) {
        const user = JSON.parse(data);
        await redis_1.default.del(redisKey);
        await redis_1.default.srem(`user_refresh_tokens:${user.id}`, refreshToken);
    }
};
exports.revokeRefreshToken = revokeRefreshToken;
const revokeAllUserRefreshTokens = async (userId) => {
    const userTokensKey = `user_refresh_tokens:${userId}`;
    const tokens = await redis_1.default.smembers(userTokensKey);
    if (tokens.length > 0) {
        const keysToDelete = tokens.map((token) => `refresh_token:${token}`);
        await redis_1.default.del(...keysToDelete, userTokensKey);
    }
};
exports.revokeAllUserRefreshTokens = revokeAllUserRefreshTokens;
// Backward-compatibility helper
const generateToken = (user) => {
    return (0, exports.generateAccessToken)(user);
};
exports.generateToken = generateToken;
