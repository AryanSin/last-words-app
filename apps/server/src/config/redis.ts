import Redis from "ioredis";
import { redisLogger } from "../utils/loggers";

const redis = new Redis({
  host: "localhost",
  port: 6379,
});

redis.on("connect", () => {
  console.log("Redis connected");
  redisLogger("Redis connected");
});

redis.on("error", (err) => {
  console.error(err);
  redisLogger("Error connecting redis : ", err);
});

export default redis;
