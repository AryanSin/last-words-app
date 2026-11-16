"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_MAIL_RETRIES = exports.MAX_REQUESTS = exports.JOB_RATE_LIMIT = exports.METRICS_RATE_LIMIT = exports.USER_RATE_LIMIT = exports.MESSAGE_RATE_LIMIT = exports.AUTH_RATE_LIMIT = exports.GLOBAL_RATE_LIMIT = exports.WINDOW_SIZE = void 0;
exports.WINDOW_SIZE = 60 * 1000; // 1 minute (60,000 ms)
// Rate Limiter Configurations (Requests per 1-minute window)
exports.GLOBAL_RATE_LIMIT = 300; // Generous global ceiling to prevent obstruction
exports.AUTH_RATE_LIMIT = 20; // Stricter protection for auth / OTP brute force
exports.MESSAGE_RATE_LIMIT = 60; // Message creation, updates, and vault browsing
exports.USER_RATE_LIMIT = 60; // Profile updates, check-ins, switch status
exports.METRICS_RATE_LIMIT = 30; // System metric reads
exports.JOB_RATE_LIMIT = 10; // Heavy manual trigger jobs
exports.MAX_REQUESTS = exports.GLOBAL_RATE_LIMIT;
exports.MAX_MAIL_RETRIES = 5;
