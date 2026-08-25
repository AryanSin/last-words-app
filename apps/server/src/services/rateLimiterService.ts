import redis from "../config/redis";
import { logger } from "../utils/loggers";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  totalLimit: number;
  resetTimeInSeconds: number;
  retryAfterInSeconds: number;
}

/**
 * Lua script for atomic sliding window rate limiting.
 *
 * KEYS[1]: rate limit key, e.g. "rate_limit:ip:127.0.0.1"
 * ARGV[1]: current timestamp in milliseconds (now)
 * ARGV[2]: window size in milliseconds
 * ARGV[3]: max allowed requests in window
 * ARGV[4]: unique member identifier
 */
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local memberId = ARGV[4]

local clearBefore = now - window

-- 1. Remove expired timestamps outside the sliding window
redis.call('ZREMRANGEBYSCORE', key, '-inf', clearBefore)

-- 2. Count requests currently in the active window
local currentRequests = redis.call('ZCARD', key)

if currentRequests < limit then
    -- Add current request timestamp
    redis.call('ZADD', key, now, memberId)
    -- Set TTL to ensure key cleans up automatically if idle
    redis.call('PEXPIRE', key, window)
    
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local oldestTimestamp = now
    if #oldest > 0 then
        oldestTimestamp = tonumber(oldest[2])
    end
    
    return { 1, limit - currentRequests - 1, oldestTimestamp }
else
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local oldestTimestamp = now
    if #oldest > 0 then
        oldestTimestamp = tonumber(oldest[2])
    end
    
    return { 0, 0, oldestTimestamp }
end
`;

export const checkRateLimit = async (
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> => {
  const now = Date.now();
  const uniqueMember = `${now}-${Math.random().toString(36).substring(2, 9)}`;
  const redisKey = `rate_limit:${key}`;

  try {
    const result = (await redis.eval(
      SLIDING_WINDOW_LUA,
      1,
      redisKey,
      now.toString(),
      windowMs.toString(),
      limit.toString(),
      uniqueMember,
    )) as [number, number, number];

    const allowed = result[0] === 1;
    const remaining = result[1];
    const oldestTimestamp = result[2];

    const resetTimestamp = oldestTimestamp + windowMs;
    const resetTimeInSeconds = Math.ceil(resetTimestamp / 1000);
    const retryAfterInSeconds = Math.max(0, Math.ceil((resetTimestamp - now) / 1000));

    return {
      allowed,
      remaining,
      totalLimit: limit,
      resetTimeInSeconds,
      retryAfterInSeconds,
    };
  } catch (error) {
    logger.error("Rate limiter Redis error, failing open to prevent outage:", error);
    return {
      allowed: true,
      remaining: limit - 1,
      totalLimit: limit,
      resetTimeInSeconds: Math.ceil((now + windowMs) / 1000),
      retryAfterInSeconds: 0,
    };
  }
};
