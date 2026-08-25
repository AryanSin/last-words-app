import { Request } from "express";
import { AUTH_RATE_LIMIT, WINDOW_SIZE } from "../../config/constants";
import { createCustomRateLimiter } from "./baseRateLimiter";

export const authRateLimiter = createCustomRateLimiter({
  name: "Auth",
  limit: AUTH_RATE_LIMIT,
  windowMs: WINDOW_SIZE,
  errorMessage: "Too many authentication attempts. Please try again in a minute.",
  keyGenerator: (req: Request) => `auth:ip:${req.ip || req.socket.remoteAddress || "unknown"}`,
});

export default authRateLimiter;
