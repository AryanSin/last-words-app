"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalRateLimiter = void 0;
const constants_1 = require("../../config/constants");
const baseRateLimiter_1 = require("./baseRateLimiter");
exports.globalRateLimiter = (0, baseRateLimiter_1.createCustomRateLimiter)({
    name: "Global",
    limit: constants_1.GLOBAL_RATE_LIMIT,
    windowMs: constants_1.WINDOW_SIZE,
    errorMessage: "Global rate limit exceeded. Please slow down.",
});
exports.default = exports.globalRateLimiter;
