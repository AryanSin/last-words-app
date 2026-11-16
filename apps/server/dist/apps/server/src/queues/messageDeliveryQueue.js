"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageDeliveryQueue = exports.MESSAGE_DELIVERY_QUEUE_NAME = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
exports.MESSAGE_DELIVERY_QUEUE_NAME = "message-delivery";
exports.messageDeliveryQueue = new bullmq_1.Queue(exports.MESSAGE_DELIVERY_QUEUE_NAME, {
    connection: redis_1.redisConnectionOptions,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 5000,
        },
        removeOnComplete: {
            count: 1000,
            age: 24 * 3600,
        },
        removeOnFail: {
            count: 5000,
        },
    },
});
