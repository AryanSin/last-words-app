"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCheckIn = exports.handleLogout = exports.handleRefreshToken = exports.verifyWhatsAppOtp = exports.sendWhatsAppOtp = exports.handleGoogleAuth = exports.handleLogin = exports.createUser = exports.getClientPlatform = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = __importDefault(require("../config/redis"));
const userDto_1 = require("../dto/userDto");
const googleAuthService_1 = __importDefault(require("../integrations/googleAuthService"));
const whatsappService_1 = require("../integrations/whatsappService");
const authServices_1 = __importDefault(require("../services/authServices"));
const otpService_1 = __importDefault(require("../services/otpService"));
const userServices_1 = __importDefault(require("../services/userServices"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const loggers_1 = require("../utils/loggers");
const authUtility_1 = require("../utils/authUtility");
const successResponse_1 = __importDefault(require("../utils/successResponse"));
const getClientPlatform = (req) => {
    const headerPlatform = req.headers["x-client-platform"];
    if (headerPlatform)
        return headerPlatform;
    const bodyPlatform = req.body?.platform;
    if (bodyPlatform)
        return bodyPlatform;
    const userAgent = (req.headers["user-agent"] || "").toLowerCase();
    if (userAgent.includes("okhttp") ||
        userAgent.includes("darwin") ||
        userAgent.includes("cfnetwork") ||
        userAgent.includes("expo")) {
        return "mobile";
    }
    return "web";
};
exports.getClientPlatform = getClientPlatform;
const createUser = async (req, res, next) => {
    const { name, email, password } = req.body;
    const existingUser = await userServices_1.default.getUserByEmail(email);
    if (existingUser) {
        throw new AppError_1.default("Email already registered", 409);
    }
    const salt = await bcrypt_1.default.genSalt(10);
    const hashedPassword = await bcrypt_1.default.hash(password, salt);
    const user = await authServices_1.default.createUser({
        name,
        email,
        password: hashedPassword,
        authProviders: [client_1.AuthProvider.LOCAL],
        lastLoginAt: new Date(),
    });
    const platform = (0, exports.getClientPlatform)(req);
    const tokens = await (0, authUtility_1.generateTokens)(user, platform);
    return (0, successResponse_1.default)(res, {
        ...tokens,
        user: (0, userDto_1.toUserResponseDtoMinimal)(user),
    }, 201);
};
exports.createUser = createUser;
const handleLogin = async (req, res, next) => {
    const { email, password } = req.parsedData;
    const user = await userServices_1.default.getUserByEmail(email);
    if (!user || !user.password) {
        throw new AppError_1.default("Invalid email or password", 401);
    }
    const passwordMatched = await bcrypt_1.default.compare(password, user.password);
    if (!passwordMatched) {
        throw new AppError_1.default("Invalid email or password", 401);
    }
    const updatedUser = await userServices_1.default.touchLastLogin(user.id);
    const platform = (0, exports.getClientPlatform)(req);
    const tokens = await (0, authUtility_1.generateTokens)(updatedUser, platform);
    return (0, successResponse_1.default)(res, {
        ...tokens,
        user: (0, userDto_1.toUserResponseDtoMinimal)(updatedUser),
    }, 200);
};
exports.handleLogin = handleLogin;
const handleGoogleAuth = async (req, res, next) => {
    const { idToken } = req.parsedData;
    const googleUserInfo = await googleAuthService_1.default.verifyIdToken(idToken);
    const user = await authServices_1.default.findOrCreateGoogleUser(googleUserInfo);
    const platform = (0, exports.getClientPlatform)(req);
    const tokens = await (0, authUtility_1.generateTokens)(user, platform);
    return (0, successResponse_1.default)(res, {
        ...tokens,
        user: (0, userDto_1.toUserResponseDtoMinimal)(user),
    }, 200);
};
exports.handleGoogleAuth = handleGoogleAuth;
const sendWhatsAppOtp = async (req, res, next) => {
    const { phoneNumber } = req.parsedData;
    const { otp, expiresInSeconds } = await otpService_1.default.generateOtp(phoneNumber);
    const sendResult = await whatsappService_1.whatsappService.sendOtp(phoneNumber, otp);
    if (!sendResult.success) {
        throw new AppError_1.default(sendResult.error || "Failed to send WhatsApp OTP. Please try again later.", 502);
    }
    return (0, successResponse_1.default)(res, {
        message: "WhatsApp verification code sent successfully.",
        expiresInSeconds,
    }, 200);
};
exports.sendWhatsAppOtp = sendWhatsAppOtp;
const verifyWhatsAppOtp = async (req, res, next) => {
    const { phoneNumber, otp, name } = req.parsedData;
    await otpService_1.default.verifyOtp(phoneNumber, otp);
    const user = await authServices_1.default.findOrCreateWhatsAppUser(phoneNumber, name);
    const platform = (0, exports.getClientPlatform)(req);
    const tokens = await (0, authUtility_1.generateTokens)(user, platform);
    return (0, successResponse_1.default)(res, {
        ...tokens,
        user: (0, userDto_1.toUserResponseDtoMinimal)(user),
    }, 200);
};
exports.verifyWhatsAppOtp = verifyWhatsAppOtp;
const handleRefreshToken = async (req, res, next) => {
    const { refreshToken } = req.parsedData;
    const platform = (0, exports.getClientPlatform)(req);
    const result = await (0, authUtility_1.rotateRefreshToken)(refreshToken, platform);
    return (0, successResponse_1.default)(res, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
    }, 200);
};
exports.handleRefreshToken = handleRefreshToken;
const handleLogout = async (req, res, next) => {
    const { refreshToken } = req.parsedData;
    if (refreshToken) {
        await (0, authUtility_1.revokeRefreshToken)(refreshToken);
    }
    // Blacklist the active access token in Redis if provided
    const authHeader = req.headers["authorization"];
    const accessToken = authHeader && authHeader.split(" ")[1];
    if (accessToken) {
        try {
            const decoded = jsonwebtoken_1.default.decode(accessToken);
            const ttl = decoded?.exp
                ? Math.max(1, decoded.exp - Math.floor(Date.now() / 1000))
                : 86400 * 30;
            await redis_1.default.set(`revoked_token:${accessToken}`, "1", "EX", ttl);
        }
        catch { }
    }
    return (0, successResponse_1.default)(res, { message: "Logged out successfully. Tokens revoked." }, 200);
};
exports.handleLogout = handleLogout;
const handleCheckIn = async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new AppError_1.default("Unauthorized", 401);
    }
    const { biometricVerified, authMethod } = (req.body || {});
    const updatedUser = await userServices_1.default.touchLastLogin(userId);
    if (biometricVerified) {
        (0, loggers_1.authLogger)(`User ${userId} confirmed heartbeat via biometric authentication`);
    }
    return (0, successResponse_1.default)(res, {
        message: biometricVerified
            ? "Biometric check-in verified! Inactivity timer refreshed."
            : "Check-in successful! Inactivity timer has been refreshed.",
        lastLoginAt: updatedUser.lastLoginAt,
        biometricVerified: Boolean(biometricVerified),
        authMethod: authMethod || (biometricVerified ? "BIOMETRIC" : "MANUAL"),
    }, 200);
};
exports.handleCheckIn = handleCheckIn;
