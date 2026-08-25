import { GLOBAL_RATE_LIMIT, WINDOW_SIZE } from "../../config/constants";
import { createCustomRateLimiter } from "./baseRateLimiter";

export const globalRateLimiter = createCustomRateLimiter({
  name: "Global",
  limit: GLOBAL_RATE_LIMIT,
  windowMs: WINDOW_SIZE,
  errorMessage: "Global rate limit exceeded. Please slow down.",
});

export default globalRateLimiter;
