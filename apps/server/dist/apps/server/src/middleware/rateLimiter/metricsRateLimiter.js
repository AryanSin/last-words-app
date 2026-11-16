"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRateLimiter = void 0;
const constants_1 = require("../../config/constants");
const baseRateLimiter_1 = require("./baseRateLimiter");
exports.metricsRateLimiter = (0, baseRateLimiter_1.createCustomRateLimiter)({
    name: "Metrics",
    limit: constants_1.METRICS_RATE_LIMIT,
    windowMs: constants_1.WINDOW_SIZE,
    errorMessage: "Too many metrics requests. Please slow down.",
});
exports.default = exports.metricsRateLimiter;
