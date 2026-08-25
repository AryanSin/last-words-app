export const WINDOW_SIZE = 60 * 1000; // 1 minute (60,000 ms)

// Rate Limiter Configurations (Requests per 1-minute window)
export const GLOBAL_RATE_LIMIT = 300; // Generous global ceiling to prevent obstruction
export const AUTH_RATE_LIMIT = 20; // Stricter protection for auth / OTP brute force
export const MESSAGE_RATE_LIMIT = 60; // Message creation, updates, and vault browsing
export const USER_RATE_LIMIT = 60; // Profile updates, check-ins, switch status
export const METRICS_RATE_LIMIT = 30; // System metric reads
export const JOB_RATE_LIMIT = 10; // Heavy manual trigger jobs

export const MAX_REQUESTS = GLOBAL_RATE_LIMIT;
export const MAX_MAIL_RETRIES = 5;
