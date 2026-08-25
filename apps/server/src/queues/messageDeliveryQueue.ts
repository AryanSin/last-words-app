import { Queue } from "bullmq";
import { redisConnectionOptions } from "../config/redis";

export const MESSAGE_DELIVERY_QUEUE_NAME = "message-delivery";

export interface MessageDeliveryJobData {
  messageId: number;
  attemptCount?: number;
}

export const messageDeliveryQueue = new Queue<
  MessageDeliveryJobData,
  any,
  string
>(MESSAGE_DELIVERY_QUEUE_NAME, {
  connection: redisConnectionOptions,
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
  },
);
