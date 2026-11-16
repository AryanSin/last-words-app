"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRateLimiter = void 0;
const constants_1 = require("../../config/constants");
const baseRateLimiter_1 = require("./baseRateLimiter");
exports.userRateLimiter = (0, baseRateLimiter_1.createCustomRateLimiter)({
    name: "Users",
    limit: constants_1.USER_RATE_LIMIT,
    windowMs: constants_1.WINDOW_SIZE,
    errorMessage: "Too many user profile requests. Please slow down.",
});
exports.default = exports.userRateLimiter;
