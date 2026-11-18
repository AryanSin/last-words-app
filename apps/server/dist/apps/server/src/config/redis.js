"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnectionOptions = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
function buildRedisOptions() {
    if (env_1.REDIS_URL) {
        try {
            const parsed = new URL(env_1.REDIS_URL);
            const isTls = parsed.protocol === "rediss:";
            const connectionOptions = {
                host: parsed.hostname,
                port: parsed.port ? parseInt(parsed.port, 10) : 6379,
                username: parsed.username || undefined,
                password: parsed.password || undefined,
                maxRetriesPerRequest: null,
                tls: isTls ? { rejectUnauthorized: false } : undefined,
            };
            const redisClient = new ioredis_1.default(env_1.REDIS_URL, {
                maxRetriesPerRequest: 3,
                lazyConnect: false,
                tls: isTls ? { rejectUnauthorized: false } : undefined,
            });
            return { connectionOptions, redisClient };
        }
        catch (e) {
            console.warn("[Redis] Failed to parse REDIS_URL, falling back to REDIS_HOST:", e);
        }
    }
    const connectionOptions = {
        host: env_1.REDIS_HOST,
        port: env_1.REDIS_PORT,
        password: env_1.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
    };
    const redisClient = new ioredis_1.default({
        host: env_1.REDIS_HOST,
        port: env_1.REDIS_PORT,
        password: env_1.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3,
        lazyConnect: false,
    });
    return { connectionOptions, redisClient };
}
const { connectionOptions, redisClient } = buildRedisOptions();
exports.redisConnectionOptions = connectionOptions;
const redis = redisClient;
redis.on("connect", () => {
    const target = env_1.REDIS_URL ? env_1.REDIS_URL.replace(/:[^:@]+@/, ":***@") : `${env_1.REDIS_HOST}:${env_1.REDIS_PORT}`;
    console.log(`[Redis] Connected to ${target}`);
});
redis.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message || err);
});
exports.default = redis;
