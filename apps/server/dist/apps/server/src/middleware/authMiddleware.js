"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticateToken = exports.authenticateToken = exports.validateRegisterInput = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const redis_1 = __importDefault(require("../config/redis"));
const userServices_1 = __importDefault(require("../services/userServices"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const validateRegisterInput = async (req, res, next) => {
    const { email } = req.parsedData;
    const existingUser = await userServices_1.default.getUserByEmail(email);
    if (!!existingUser) {
        throw new AppError_1.default("Email already registered", 409);
    }
    next();
};
exports.validateRegisterInput = validateRegisterInput;
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        throw new AppError_1.default("Unauthorized. No token provided.", 401);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET);
        // Check if token was explicitly revoked on logout
        const isRevoked = await redis_1.default.get(`revoked_token:${token}`).catch(() => null);
        if (isRevoked) {
            throw new AppError_1.default("Access token has been revoked. Please sign in again.", 401);
        }
        const user = await userServices_1.default.getUserById(Number(decoded.id));
        if (!user) {
            throw new AppError_1.default("User account not found", 404);
        }
        req.user = user;
        req.userId = user.id;
        next();
    }
    catch (err) {
        if (err instanceof AppError_1.default) {
            return next(err);
        }
        if (err.name === "TokenExpiredError") {
            return next(new AppError_1.default("Access token has expired. Please refresh session.", 401));
        }
        if (err.name === "JsonWebTokenError") {
            return next(new AppError_1.default("Invalid access token", 401));
        }
        return next(err);
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuthenticateToken = async (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.JWT_SECRET);
        // Check if token was explicitly revoked on logout
        const isRevoked = await redis_1.default.get(`revoked_token:${token}`).catch(() => null);
        if (isRevoked) {
            throw new AppError_1.default("Access token has been revoked. Please sign in again.", 401);
        }
        const user = await userServices_1.default.getUserById(Number(decoded.id));
        if (user) {
            req.user = user;
            req.userId = user.id;
        }
        next();
    }
    catch {
        // In optional mode, proceed even if token is missing or expired
        next();
    }
};
exports.optionalAuthenticateToken = optionalAuthenticateToken;
