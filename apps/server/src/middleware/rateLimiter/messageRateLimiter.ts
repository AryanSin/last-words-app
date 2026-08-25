import { MESSAGE_RATE_LIMIT, WINDOW_SIZE } from "../../config/constants";
import { createCustomRateLimiter } from "./baseRateLimiter";

export const messageRateLimiter = createCustomRateLimiter({
  name: "Messages",
  limit: MESSAGE_RATE_LIMIT,
  windowMs: WINDOW_SIZE,
  errorMessage: "Too many message operations. Please slow down.",
});

export default messageRateLimiter;
