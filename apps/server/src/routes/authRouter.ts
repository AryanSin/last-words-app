import {
  googleAuthSchema,
  loginUserSchema,
  refreshTokenSchema,
  registerUserSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "@shared/schemas/authSchemas";
import express from "express";
import {
  createUser,
  handleCheckIn,
  handleGoogleAuth,
  handleLogin,
  handleLogout,
  handleRefreshToken,
  sendWhatsAppOtp,
  verifyWhatsAppOtp,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";
import authRateLimiter from "../middleware/rateLimiter/authRateLimiter";
import validate from "../middleware/validate";
import { catchAsync } from "../utils/catchAsync";
import { authLogger, loggerMiddlewareFunction } from "../utils/loggers";

const authRouter = express.Router();

authRouter.use(loggerMiddlewareFunction(authLogger));
authRouter.use(authRateLimiter);

authRouter
  .route("/register")
  .post(validate(registerUserSchema), catchAsync(createUser));

authRouter
  .route("/login")
  .post(validate(loginUserSchema), catchAsync(handleLogin));

authRouter
  .route("/refresh")
  .post(validate(refreshTokenSchema), catchAsync(handleRefreshToken));

authRouter
  .route("/logout")
  .post(validate(refreshTokenSchema), catchAsync(handleLogout));

authRouter
  .route("/google")
  .post(validate(googleAuthSchema), catchAsync(handleGoogleAuth));

authRouter
  .route("/whatsapp/send-otp")
  .post(validate(sendOtpSchema), catchAsync(sendWhatsAppOtp));

authRouter
  .route("/whatsapp/verify-otp")
  .post(validate(verifyOtpSchema), catchAsync(verifyWhatsAppOtp));

authRouter
  .route("/check-in")
  .post(catchAsync(authenticateToken), catchAsync(handleCheckIn));

export default authRouter;
