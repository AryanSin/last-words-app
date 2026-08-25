import express from "express";
import { getSystemMetrics } from "../controllers/metricsController";
import metricsRateLimiter from "../middleware/rateLimiter/metricsRateLimiter";
import { catchAsync } from "../utils/catchAsync";

const metricsRouter = express.Router();

metricsRouter.use(metricsRateLimiter);

metricsRouter.route("/messages").get(catchAsync(getSystemMetrics));

export default metricsRouter;
