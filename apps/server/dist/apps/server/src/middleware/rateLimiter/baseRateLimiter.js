"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCustomRateLimiter = void 0;
const constants_1 = require("../../config/constants");
const rateLimiterService_1 = require("../../services/rateLimiterService");
const AppError_1 = __importDefault(require("../../utils/AppError"));
const createCustomRateLimiter = (options) => {
    const { name, limit, windowMs = constants_1.WINDOW_SIZE, errorMessage = `Too many requests for ${name}. Please slow down.`, keyGenerator, } = options;
    const defaultKeyGen = (req) => {
        const identifier = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip || "unknown"}`;
        return `${name}:${identifier}`;
    };
    const keyGen = keyGenerator ?? defaultKeyGen;
    return async (req, res, next) => {
        try {
            const key = keyGen(req);
            const result = await (0, rateLimiterService_1.checkRateLimit)(key, limit, windowMs);
            res.setHeader("X-RateLimit-Limit", result.totalLimit);
            res.setHeader("X-RateLimit-Remaining", result.remaining);
            res.setHeader("X-RateLimit-Reset", result.resetTimeInSeconds);
            res.setHeader(`X-RateLimit-${name}-Limit`, result.totalLimit);
            res.setHeader(`X-RateLimit-${name}-Remaining`, result.remaining);
            res.setHeader(`X-RateLimit-${name}-Reset`, result.resetTimeInSeconds);
            if (!result.allowed) {
                res.setHeader("Retry-After", result.retryAfterInSeconds);
                return next(new AppError_1.default(errorMessage, 429));
            }
            next();
        }
        catch (err) {
            next(err);
        }
    };
};
exports.createCustomRateLimiter = createCustomRateLimiter;
