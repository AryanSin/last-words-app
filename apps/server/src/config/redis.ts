import Redis from "ioredis";
import { REDIS_HOST, REDIS_PORT } from "./env";
import { redisLogger } from "../utils/loggers";

const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: 3,
});

redis.on("connect", () => {
  console.log(`Redis connected to ${REDIS_HOST}:${REDIS_PORT}`);
  redisLogger("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
  redisLogger("Error connecting redis : ", err);
});

export default redis;
