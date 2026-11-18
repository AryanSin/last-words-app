import { ConnectionOptions } from "bullmq";
import Redis, { RedisOptions } from "ioredis";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT, REDIS_URL } from "./env";

function buildRedisOptions(): { connectionOptions: ConnectionOptions; redisClient: Redis } {
  if (REDIS_URL) {
    try {
      const parsed = new URL(REDIS_URL);
      const isTls = parsed.protocol === "rediss:";
      const connectionOptions: ConnectionOptions = {
        host: parsed.hostname,
        port: parsed.port ? parseInt(parsed.port, 10) : 6379,
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        maxRetriesPerRequest: null,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
      };

      const redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        lazyConnect: false,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
      });

      return { connectionOptions, redisClient };
    } catch (e) {
      console.warn("[Redis] Failed to parse REDIS_URL, falling back to REDIS_HOST:", e);
    }
  }

  const connectionOptions: ConnectionOptions = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  };

  const redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });

  return { connectionOptions, redisClient };
}

const { connectionOptions, redisClient } = buildRedisOptions();

export const redisConnectionOptions: ConnectionOptions = connectionOptions;
const redis = redisClient;

redis.on("connect", () => {
  const target = REDIS_URL ? REDIS_URL.replace(/:[^:@]+@/, ":***@") : `${REDIS_HOST}:${REDIS_PORT}`;
  console.log(`[Redis] Connected to ${target}`);
});

redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message || err);
});

export default redis;
