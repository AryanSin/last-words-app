"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobRateLimiter = void 0;
const constants_1 = require("../../config/constants");
const baseRateLimiter_1 = require("./baseRateLimiter");
exports.jobRateLimiter = (0, baseRateLimiter_1.createCustomRateLimiter)({
    name: "Jobs",
    limit: constants_1.JOB_RATE_LIMIT,
    windowMs: constants_1.WINDOW_SIZE,
    errorMessage: "Too many job execution requests. Please wait before triggering another job.",
    keyGenerator: (req) => `jobs:ip:${req.ip || req.socket.remoteAddress || "unknown"}`,
});
exports.default = exports.jobRateLimiter;
