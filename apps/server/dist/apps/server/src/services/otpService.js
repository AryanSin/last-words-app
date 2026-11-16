"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const redis_1 = __importDefault(require("../config/redis"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const loggers_1 = require("../utils/loggers");
const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const MAX_VERIFY_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 600; // 10 minutes
const MAX_OTP_SENDS_IN_WINDOW = 3;
exports.otpService = {
    async generateOtp(phoneNumber) {
        const rateLimitKey = `otp:ratelimit:${phoneNumber}`;
        const sendCount = await redis_1.default.incr(rateLimitKey);
        if (sendCount === 1) {
            await redis_1.default.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
        }
        else if (sendCount > MAX_OTP_SENDS_IN_WINDOW) {
            const ttl = await redis_1.default.ttl(rateLimitKey);
            throw new AppError_1.default(`Too many OTP requests. Please try again in ${Math.ceil(ttl / 60)} minute(s).`, 429);
        }
        const otp = crypto_1.default.randomInt(100000, 1000000).toString();
        const codeKey = `otp:code:${phoneNumber}`;
        const attemptsKey = `otp:attempts:${phoneNumber}`;
        await redis_1.default.set(codeKey, otp, "EX", OTP_EXPIRY_SECONDS);
        await redis_1.default.set(attemptsKey, 0, "EX", OTP_EXPIRY_SECONDS);
        loggers_1.logger.info(`Generated OTP for ${phoneNumber}`);
        return {
            otp,
            expiresInSeconds: OTP_EXPIRY_SECONDS,
        };
    },
    async verifyOtp(phoneNumber, inputOtp) {
        const codeKey = `otp:code:${phoneNumber}`;
        const attemptsKey = `otp:attempts:${phoneNumber}`;
        const storedOtp = await redis_1.default.get(codeKey);
        if (!storedOtp) {
            throw new AppError_1.default("OTP has expired or was not requested. Please request a new one.", 400);
        }
        const currentAttempts = await redis_1.default.incr(attemptsKey);
        if (currentAttempts > MAX_VERIFY_ATTEMPTS) {
            await redis_1.default.del(codeKey);
            await redis_1.default.del(attemptsKey);
            throw new AppError_1.default("Too many incorrect attempts. This OTP has been invalidated.", 429);
        }
        if (storedOtp !== inputOtp.trim()) {
            const remaining = MAX_VERIFY_ATTEMPTS - currentAttempts;
            throw new AppError_1.default(`Invalid OTP. You have ${remaining} attempt(s) remaining.`, 400);
        }
        await redis_1.default.del(codeKey);
        await redis_1.default.del(attemptsKey);
        return true;
    },
};
exports.default = exports.otpService;
