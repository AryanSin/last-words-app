"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushNotificationService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const redis_1 = __importDefault(require("../config/redis"));
const loggers_1 = require("../utils/loggers");
class PushNotificationService {
    EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
    /**
     * Register or update a device push token for a user.
     */
    async registerDeviceToken(userId, token, platform = "mobile") {
        const existing = await prisma_1.default.deviceToken.findUnique({
            where: { token },
        });
        if (existing) {
            if (existing.userId !== userId || existing.platform !== platform) {
                return prisma_1.default.deviceToken.update({
                    where: { token },
                    data: { userId, platform, updatedAt: new Date() },
                });
            }
            return existing;
        }
        return prisma_1.default.deviceToken.create({
            data: {
                userId,
                token,
                platform,
            },
        });
    }
    /**
     * Remove a registered device token (e.g. on logout).
     */
    async removeDeviceToken(userId, token) {
        return prisma_1.default.deviceToken.deleteMany({
            where: {
                userId,
                token,
            },
        });
    }
    /**
     * Get all registered push tokens for a user.
     */
    async getUserDeviceTokens(userId) {
        const devices = await prisma_1.default.deviceToken.findMany({
            where: { userId },
            select: { token: true },
        });
        return devices.map((d) => d.token);
    }
    /**
     * Send push notification to a batch of tokens.
     */
    async sendPushNotification(tokens, payload) {
        if (!tokens || tokens.length === 0) {
            return [];
        }
        const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
        const results = [];
        // Separate Expo tokens from mock/dev tokens
        const expoTokens = uniqueTokens.filter((t) => t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["));
        const mockTokens = uniqueTokens.filter((t) => !t.startsWith("ExponentPushToken[") && !t.startsWith("ExpoPushToken["));
        // 1. Process Expo tokens via HTTP API if any
        if (expoTokens.length > 0) {
            try {
                const messages = expoTokens.map((to) => ({
                    to,
                    sound: payload.sound || "default",
                    title: payload.title,
                    body: payload.body,
                    data: payload.data || {},
                    badge: payload.badge,
                }));
                const response = await fetch(this.EXPO_PUSH_URL, {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "Accept-encoding": "gzip, deflate",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(messages),
                    signal: AbortSignal.timeout(6000),
                });
                const data = await response.json();
                if (data && data.data && Array.isArray(data.data)) {
                    data.data.forEach((ticket, idx) => {
                        const token = expoTokens[idx];
                        if (ticket.status === "ok") {
                            results.push({ token, status: "ok" });
                        }
                        else {
                            results.push({
                                token,
                                status: "error",
                                message: ticket.message || ticket.details?.error,
                            });
                        }
                    });
                }
            }
            catch (err) {
                loggers_1.logger.error("[PushService] Failed sending to Expo Push API:", err);
                expoTokens.forEach((token) => {
                    results.push({ token, status: "error", message: err.message });
                });
            }
        }
        // 2. Process Mock / Dev tokens (and save to redis for verification / testing)
        for (const token of mockTokens) {
            const mockLog = {
                token,
                title: payload.title,
                body: payload.body,
                data: payload.data,
                sentAt: new Date().toISOString(),
            };
            console.log(`\n================== [PUSH NOTIFICATION DEV MOCK] ==================`);
            console.log(`To Device Token: ${token}`);
            console.log(`Title: ${payload.title}`);
            console.log(`Body: ${payload.body}`);
            console.log(`Data: ${JSON.stringify(payload.data || {})}`);
            console.log(`==================================================================\n`);
            try {
                await redis_1.default.lpush("dev:push_notifications", JSON.stringify(mockLog));
                await redis_1.default.ltrim("dev:push_notifications", 0, 99); // keep last 100
            }
            catch { }
            results.push({ token, status: "ok" });
        }
        return results;
    }
}
exports.pushNotificationService = new PushNotificationService();
exports.default = exports.pushNotificationService;
