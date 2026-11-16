"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = void 0;
const constants_1 = require("../../config/constants");
const baseRateLimiter_1 = require("./baseRateLimiter");
exports.authRateLimiter = (0, baseRateLimiter_1.createCustomRateLimiter)({
    name: "Auth",
    limit: constants_1.AUTH_RATE_LIMIT,
    windowMs: constants_1.WINDOW_SIZE,
    errorMessage: "Too many authentication attempts. Please try again in a minute.",
    keyGenerator: (req) => `auth:ip:${req.ip || req.socket.remoteAddress || "unknown"}`,
});
exports.default = exports.authRateLimiter;
