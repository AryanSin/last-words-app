"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthService = void 0;
const google_auth_library_1 = require("google-auth-library");
const env_1 = require("../config/env");
const AppError_1 = __importDefault(require("../utils/AppError"));
const loggers_1 = require("../utils/loggers");
const client = new google_auth_library_1.OAuth2Client(env_1.GOOGLE_CLIENT_ID || undefined);
exports.googleAuthService = {
    async verifyIdToken(idToken) {
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: env_1.GOOGLE_CLIENT_ID ? env_1.GOOGLE_CLIENT_ID : undefined,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.sub || !payload.email) {
                throw new AppError_1.default("Invalid Google token payload", 400);
            }
            return {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name || payload.given_name,
                picture: payload.picture,
                emailVerified: !!payload.email_verified,
            };
        }
        catch (err) {
            loggers_1.logger.error("Google ID Token verification failed:", err);
            if (err instanceof AppError_1.default)
                throw err;
            throw new AppError_1.default(err?.message || "Invalid or expired Google ID token", 401);
        }
    },
};
exports.default = exports.googleAuthService;
