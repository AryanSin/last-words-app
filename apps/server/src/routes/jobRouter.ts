import express, { NextFunction, Request, Response } from "express";
import { runMessageTriggerService } from "../services/messageTriggerService";
import { catchAsync } from "../utils/catchAsync";

const jobRouter = express.Router();

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

export default jobRouter;
