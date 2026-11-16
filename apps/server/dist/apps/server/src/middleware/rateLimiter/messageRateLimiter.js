"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRateLimiter = void 0;
const constants_1 = require("../../config/constants");
const baseRateLimiter_1 = require("./baseRateLimiter");
exports.messageRateLimiter = (0, baseRateLimiter_1.createCustomRateLimiter)({
    name: "Messages",
    limit: constants_1.MESSAGE_RATE_LIMIT,
    windowMs: constants_1.WINDOW_SIZE,
    errorMessage: "Too many message operations. Please slow down.",
});
exports.default = exports.messageRateLimiter;
