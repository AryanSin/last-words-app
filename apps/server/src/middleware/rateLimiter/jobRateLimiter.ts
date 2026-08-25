import { Request } from "express";
import { JOB_RATE_LIMIT, WINDOW_SIZE } from "../../config/constants";
import { createCustomRateLimiter } from "./baseRateLimiter";

export const jobRateLimiter = createCustomRateLimiter({
  name: "Jobs",
  limit: JOB_RATE_LIMIT,
  windowMs: WINDOW_SIZE,
  errorMessage: "Too many job execution requests. Please wait before triggering another job.",
  keyGenerator: (req: Request) => `jobs:ip:${req.ip || req.socket.remoteAddress || "unknown"}`,
});

export default jobRateLimiter;
