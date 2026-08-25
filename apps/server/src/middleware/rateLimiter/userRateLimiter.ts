import { USER_RATE_LIMIT, WINDOW_SIZE } from "../../config/constants";
import { createCustomRateLimiter } from "./baseRateLimiter";

export const userRateLimiter = createCustomRateLimiter({
  name: "Users",
  limit: USER_RATE_LIMIT,
  windowMs: WINDOW_SIZE,
  errorMessage: "Too many user profile requests. Please slow down.",
});

export default userRateLimiter;
