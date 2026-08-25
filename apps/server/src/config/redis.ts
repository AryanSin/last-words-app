import { ConnectionOptions } from "bullmq";
import Redis from "ioredis";
import { REDIS_HOST, REDIS_PORT } from "./env";

export const redisConnectionOptions: ConnectionOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
};

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on("connect", () => {
  console.log(`[Redis] Connected to ${REDIS_HOST}:${REDIS_PORT}`);
});

redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message || err);
});

export default redis;
