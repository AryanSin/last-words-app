"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authSchemas_1 = require("@shared/schemas/authSchemas");
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const authRateLimiter_1 = __importDefault(require("../middleware/rateLimiter/authRateLimiter"));
const validate_1 = __importDefault(require("../middleware/validate"));
const catchAsync_1 = require("../utils/catchAsync");
const loggers_1 = require("../utils/loggers");
const authRouter = express_1.default.Router();
authRouter.use((0, loggers_1.loggerMiddlewareFunction)(loggers_1.authLogger));
authRouter.use(authRateLimiter_1.default);
authRouter
    .route("/register")
    .post((0, validate_1.default)(authSchemas_1.registerUserSchema), (0, catchAsync_1.catchAsync)(authController_1.createUser));
authRouter
    .route("/login")
    .post((0, validate_1.default)(authSchemas_1.loginUserSchema), (0, catchAsync_1.catchAsync)(authController_1.handleLogin));
authRouter
    .route("/refresh")
    .post((0, validate_1.default)(authSchemas_1.refreshTokenSchema), (0, catchAsync_1.catchAsync)(authController_1.handleRefreshToken));
authRouter
    .route("/logout")
    .post((0, validate_1.default)(authSchemas_1.refreshTokenSchema), (0, catchAsync_1.catchAsync)(authController_1.handleLogout));
authRouter
    .route("/google")
    .post((0, validate_1.default)(authSchemas_1.googleAuthSchema), (0, catchAsync_1.catchAsync)(authController_1.handleGoogleAuth));
authRouter
    .route("/whatsapp/send-otp")
    .post((0, validate_1.default)(authSchemas_1.sendOtpSchema), (0, catchAsync_1.catchAsync)(authController_1.sendWhatsAppOtp));
authRouter
    .route("/whatsapp/verify-otp")
    .post((0, validate_1.default)(authSchemas_1.verifyOtpSchema), (0, catchAsync_1.catchAsync)(authController_1.verifyWhatsAppOtp));
authRouter
    .route("/check-in")
    .post((0, catchAsync_1.catchAsync)(authMiddleware_1.authenticateToken), (0, catchAsync_1.catchAsync)(authController_1.handleCheckIn));
exports.default = authRouter;
