import {
  googleAuthSchema,
  loginUserSchema,
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
  sendWhatsAppOtp,
  verifyWhatsAppOtp,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";
import validate from "../middleware/validate";
import { catchAsync } from "../utils/catchAsync";
import { authLogger, loggerMiddlewareFunction } from "../utils/loggers";

const authRouter = express.Router();

authRouter.use(loggerMiddlewareFunction(authLogger));

// Email / Password Registration & Login
authRouter
  .route("/register")
  .post(validate(registerUserSchema), catchAsync(createUser));

authRouter
  .route("/login")
  .post(validate(loginUserSchema), catchAsync(handleLogin));

// Google OAuth ID Token
authRouter
  .route("/google")
  .post(validate(googleAuthSchema), catchAsync(handleGoogleAuth));

// WhatsApp / Mobile Number OTP
authRouter
  .route("/whatsapp/send-otp")
  .post(validate(sendOtpSchema), catchAsync(sendWhatsAppOtp));

authRouter
  .route("/whatsapp/verify-otp")
  .post(validate(verifyOtpSchema), catchAsync(verifyWhatsAppOtp));

// Authenticated Check-In / Heartbeat
authRouter
  .route("/check-in")
  .post(catchAsync(authenticateToken), catchAsync(handleCheckIn));

export default authRouter;
