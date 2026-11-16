"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnectionOptions = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("./env");
exports.redisConnectionOptions = {
    host: env_1.REDIS_HOST,
    port: env_1.REDIS_PORT,
    maxRetriesPerRequest: null,
};
const redis = new ioredis_1.default({
    host: env_1.REDIS_HOST,
    port: env_1.REDIS_PORT,
    maxRetriesPerRequest: 3,
    lazyConnect: false,
});
redis.on("connect", () => {
    console.log(`[Redis] Connected to ${env_1.REDIS_HOST}:${env_1.REDIS_PORT}`);
});
redis.on("error", (err) => {
    console.error("[Redis] Connection error:", err.message || err);
});
exports.default = redis;
