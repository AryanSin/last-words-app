import express from "express";
import { getSystemMetrics } from "../controllers/metricsController";
import { catchAsync } from "../utils/catchAsync";

const metricsRouter = express.Router();

metricsRouter.route("/messages").get(catchAsync(getSystemMetrics));

export default metricsRouter;
