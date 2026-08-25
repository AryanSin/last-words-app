import express, { NextFunction, Request, Response } from "express";
import jobRateLimiter from "../middleware/rateLimiter/jobRateLimiter";
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

export default jobRouter;
