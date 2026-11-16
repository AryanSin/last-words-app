import { testMessageSchema } from "@shared/schemas/messageSchemas";
import express, { NextFunction, Request, Response } from "express";
import {
  getQueuedMailJobStatusController,
  getRecentQueuedMailJobsController,
  testMessageDeliveryController,
} from "../controllers/messageController";
import jobRateLimiter from "../middleware/rateLimiter/jobRateLimiter";
import validate from "../middleware/validate";
import { runMessageTriggerService } from "../services/messageTriggerService";
import { runPushReminderService } from "../services/pushReminderService";
import { catchAsync } from "../utils/catchAsync";

const jobRouter = express.Router();

jobRouter.use(jobRateLimiter);

jobRouter.route("/trigger-message").post(
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    await runMessageTriggerService();
    return res.status(200).json({
      status: "success",
      data: "executed",
      requestedAt: res.requestTime,
    });
  }),
);

jobRouter.route("/trigger-reminders").post(
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const summary = await runPushReminderService();
    return res.status(200).json({
      status: "success",
      data: summary,
      requestedAt: res.requestTime,
    });
  }),
);

jobRouter
  .route("/test-message")
  .post(validate(testMessageSchema), catchAsync(testMessageDeliveryController));

jobRouter
  .route("/test-send")
  .post(validate(testMessageSchema), catchAsync(testMessageDeliveryController));

jobRouter
  .route("/test-queue")
  .get(catchAsync(getRecentQueuedMailJobsController));

jobRouter
  .route("/test-queue/:jobId")
  .get(catchAsync(getQueuedMailJobStatusController));

export default jobRouter;
