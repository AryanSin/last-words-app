import { NextFunction, Request, Response } from "express";
import { WINDOW_SIZE } from "../../config/constants";
import { checkRateLimit } from "../../services/rateLimiterService";
import AppError from "../../utils/AppError";

export interface RateLimiterOptions {
  name: string;
  limit: number;
  windowMs?: number;
  errorMessage?: string;
  keyGenerator?: (req: Request) => string;
}

export const createCustomRateLimiter = (options: RateLimiterOptions) => {
  const {
    name,
    limit,
    windowMs = WINDOW_SIZE,
    errorMessage = `Too many requests for ${name}. Please slow down.`,
    keyGenerator,
  } = options;

  const defaultKeyGen = (req: Request) => {
    const identifier = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip || "unknown"}`;
    return `${name}:${identifier}`;
  };

  const keyGen = keyGenerator ?? defaultKeyGen;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGen(req);
      const result = await checkRateLimit(key, limit, windowMs);

      res.setHeader("X-RateLimit-Limit", result.totalLimit);
      res.setHeader("X-RateLimit-Remaining", result.remaining);
      res.setHeader("X-RateLimit-Reset", result.resetTimeInSeconds);
      res.setHeader(`X-RateLimit-${name}-Limit`, result.totalLimit);
      res.setHeader(`X-RateLimit-${name}-Remaining`, result.remaining);
      res.setHeader(`X-RateLimit-${name}-Reset`, result.resetTimeInSeconds);

      if (!result.allowed) {
        res.setHeader("Retry-After", result.retryAfterInSeconds);
        return next(new AppError(errorMessage, 429));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
