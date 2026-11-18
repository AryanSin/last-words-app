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
// Collect all configured client IDs as valid audiences
const validAudiences = [
    ...env_1.GOOGLE_CLIENT_ID.split(",").map((s) => s.trim()),
    env_1.GOOGLE_IOS_CLIENT_ID,
    env_1.GOOGLE_ANDROID_CLIENT_ID,
    env_1.GOOGLE_WEB_CLIENT_ID,
].filter(Boolean);
exports.googleAuthService = {
    async verifyIdToken(idToken) {
        // 1. Primary check: Verify via google-auth-library
        try {
            const ticket = await client.verifyIdToken({
                idToken,
                audience: validAudiences.length > 0
                    ? validAudiences.length === 1
                        ? validAudiences[0]
                        : validAudiences
                    : undefined,
            });
            const payload = ticket.getPayload();
            if (payload && payload.sub && payload.email) {
                return {
                    googleId: payload.sub,
                    email: payload.email,
                    name: payload.name || payload.given_name,
                    picture: payload.picture,
                    emailVerified: !!payload.email_verified,
                };
            }
        }
        catch (err) {
            loggers_1.logger.warn("Standard client.verifyIdToken did not resolve token, checking Google userinfo/tokeninfo endpoints...");
        }
        // 2. Fallback check: Google OAuth2 userinfo endpoint (handles OAuth access tokens)
        try {
            const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (userinfoRes.ok) {
                const info = (await userinfoRes.json());
                if (info.sub && info.email) {
                    return {
                        googleId: info.sub,
                        email: info.email,
                        name: info.name || info.given_name,
                        picture: info.picture,
                        emailVerified: !!info.email_verified,
                    };
                }
            }
        }
        catch { }
        // 3. Fallback check: Google tokeninfo endpoint
        try {
            const tokeninfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
            if (tokeninfoRes.ok) {
                const info = (await tokeninfoRes.json());
                if (info.sub && info.email) {
                    return {
                        googleId: info.sub,
                        email: info.email,
                        name: info.name || info.given_name,
                        picture: info.picture,
                        emailVerified: info.email_verified === "true" || info.email_verified === true,
                    };
                }
            }
        }
        catch { }
        throw new AppError_1.default("Invalid or expired Google ID token", 401);
    },
};
exports.default = exports.googleAuthService;
