import {
  createMessageSchema,
  testMessageSchema,
  updateMessageSchema,
} from "@shared/schemas/messageSchemas";
import express from "express";
import {
  createMessage,
  deleteMessageByMessageId,
  getAllMessages,
  getMessageById,
  getQueuedMailJobStatusController,
  getRecentQueuedMailJobsController,
  getUserMessages,
  testMessageDeliveryController,
  updateMessage,
} from "../controllers/messageController";
import messageRateLimiter from "../middleware/rateLimiter/messageRateLimiter";
import validate from "../middleware/validate";
import { catchAsync } from "../utils/catchAsync";
import { loggerMiddlewareFunction, messageLogger } from "../utils/loggers";

const messageRouter = express.Router();

messageRouter.use(messageRateLimiter);

messageRouter
  .route("/")
  .get(catchAsync(getAllMessages))
  .post(validate(createMessageSchema), catchAsync(createMessage));

messageRouter.param("id", loggerMiddlewareFunction(messageLogger));

messageRouter.route("/me").get(catchAsync(getUserMessages));

messageRouter
  .route("/test")
  .post(validate(testMessageSchema), catchAsync(testMessageDeliveryController));

messageRouter
  .route("/test-send")
  .post(validate(testMessageSchema), catchAsync(testMessageDeliveryController));

messageRouter
  .route("/test/queue")
  .get(catchAsync(getRecentQueuedMailJobsController));

messageRouter
  .route("/test/queue/:jobId")
  .get(catchAsync(getQueuedMailJobStatusController));

messageRouter
  .route("/:id")
  .get(catchAsync(getMessageById))
  .delete(catchAsync(deleteMessageByMessageId))
  .patch(validate(updateMessageSchema), catchAsync(updateMessage));

export default messageRouter;
