import { METRICS_RATE_LIMIT, WINDOW_SIZE } from "../../config/constants";
import { createCustomRateLimiter } from "./baseRateLimiter";

export const metricsRateLimiter = createCustomRateLimiter({
  name: "Metrics",
  limit: METRICS_RATE_LIMIT,
  windowMs: WINDOW_SIZE,
  errorMessage: "Too many metrics requests. Please slow down.",
});

export default metricsRateLimiter;
