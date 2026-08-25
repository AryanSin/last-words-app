import crypto from "crypto";
import redis from "../config/redis";
import AppError from "../utils/AppError";
import { logger } from "../utils/loggers";

const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const MAX_VERIFY_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 600; // 10 minutes
const MAX_OTP_SENDS_IN_WINDOW = 3;

export const otpService = {
  async generateOtp(phoneNumber: string): Promise<{ otp: string; expiresInSeconds: number }> {
    const rateLimitKey = `otp:ratelimit:${phoneNumber}`;
    const sendCount = await redis.incr(rateLimitKey);

    if (sendCount === 1) {
      await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
    } else if (sendCount > MAX_OTP_SENDS_IN_WINDOW) {
      const ttl = await redis.ttl(rateLimitKey);
      throw new AppError(
        `Too many OTP requests. Please try again in ${Math.ceil(ttl / 60)} minute(s).`,
        429,
      );
    }

    const otp = crypto.randomInt(100000, 1000000).toString();

    const codeKey = `otp:code:${phoneNumber}`;
    const attemptsKey = `otp:attempts:${phoneNumber}`;

    await redis.set(codeKey, otp, "EX", OTP_EXPIRY_SECONDS);
    await redis.set(attemptsKey, 0, "EX", OTP_EXPIRY_SECONDS);

    logger.info(`Generated OTP for ${phoneNumber}`);

    return {
      otp,
      expiresInSeconds: OTP_EXPIRY_SECONDS,
    };
  },

  async verifyOtp(phoneNumber: string, inputOtp: string): Promise<boolean> {
    const codeKey = `otp:code:${phoneNumber}`;
    const attemptsKey = `otp:attempts:${phoneNumber}`;

    const storedOtp = await redis.get(codeKey);

    if (!storedOtp) {
      throw new AppError("OTP has expired or was not requested. Please request a new one.", 400);
    }

    const currentAttempts = await redis.incr(attemptsKey);

    if (currentAttempts > MAX_VERIFY_ATTEMPTS) {
      await redis.del(codeKey);
      await redis.del(attemptsKey);
      throw new AppError("Too many incorrect attempts. This OTP has been invalidated.", 429);
    }

    if (storedOtp !== inputOtp.trim()) {
      const remaining = MAX_VERIFY_ATTEMPTS - currentAttempts;
      throw new AppError(`Invalid OTP. You have ${remaining} attempt(s) remaining.`, 400);
    }

    await redis.del(codeKey);
    await redis.del(attemptsKey);

    return true;
  },
};

export default otpService;
