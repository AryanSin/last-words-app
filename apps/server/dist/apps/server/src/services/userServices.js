"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const crypto_1 = require("../utils/crypto");
const userServices = {
    checkUserExistsById: async (id) => {
        const user = await prisma_1.default.user.findUnique({
            where: {
                id,
            },
        });
        return !!user;
    },
    getUserById: async (id) => {
        return await prisma_1.default.user.findUnique({
            where: {
                id,
            },
        });
    },
    getUserByEmail: async (email) => {
        return await prisma_1.default.user.findUnique({
            where: {
                email,
            },
        });
    },
    getUserByPhone: async (phoneNumber) => {
        return await prisma_1.default.user.findUnique({
            where: {
                phoneNumber,
            },
        });
    },
    getUserByGoogleId: async (googleId) => {
        return await prisma_1.default.user.findUnique({
            where: {
                googleId,
            },
        });
    },
    getUsers: async (usersProps) => {
        return await prisma_1.default.user.findMany(usersProps);
    },
    getUsersCount: async () => {
        return await prisma_1.default.user.count();
    },
    deleteUserById: async (id) => {
        return await prisma_1.default.user.delete({ where: { id } });
    },
    getMessagesByUserId: async (id, messageProps) => {
        const user = await prisma_1.default.user.findUnique({
            where: { id },
            select: {
                messages: {
                    ...messageProps,
                    include: {
                        deliveryEvents: true,
                    },
                },
            },
        });
        if (user && user.messages) {
            return {
                ...user,
                messages: (0, crypto_1.decryptMessageList)(user.messages),
            };
        }
        return user;
    },
    getUserSwitchStatus: async (userId) => {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                lastLoginAt: true,
                defaultTriggerAfterDays: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new AppError_1.default("User not found", 404);
        }
        const messages = await prisma_1.default.message.findMany({
            where: { userId },
            select: {
                id: true,
                title: true,
                recipientName: true,
                deliveryChannel: true,
                triggerAfterDays: true,
                status: true,
            },
        });
        const pendingMessages = messages.filter((m) => m.status === client_1.MessageStatus.PENDING);
        const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : new Date(user.createdAt);
        const now = Date.now();
        const daysPassed = Math.floor((now - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
        if (pendingMessages.length === 0) {
            const defaultThreshold = user.defaultTriggerAfterDays ?? 365;
            const daysRemaining = Math.max(0, defaultThreshold - daysPassed);
            return {
                daysRemaining,
                daysPassed,
                lastLoginAt: lastLogin.toISOString(),
                inactivityThreshold: defaultThreshold,
                hasPendingMessages: false,
                totalMessages: messages.length,
                pendingMessages: 0,
                isUrgent: daysRemaining <= 7,
                soonestMessage: null,
                isEncrypted: true,
                encryptionAlgorithm: "AES-256-GCM",
            };
        }
        // Find the soonest message to be triggered
        let soonest = null;
        for (const msg of pendingMessages) {
            const threshold = msg.triggerAfterDays ?? user.defaultTriggerAfterDays ?? 365;
            const remaining = Math.max(0, threshold - daysPassed);
            if (!soonest || remaining < soonest.daysRemaining) {
                soonest = {
                    message: msg,
                    daysRemaining: remaining,
                    triggerThreshold: threshold,
                };
            }
        }
        const soonestResult = soonest;
        return {
            daysRemaining: soonestResult.daysRemaining,
            daysPassed,
            lastLoginAt: lastLogin.toISOString(),
            inactivityThreshold: soonestResult.triggerThreshold,
            hasPendingMessages: true,
            totalMessages: messages.length,
            pendingMessages: pendingMessages.length,
            isUrgent: soonestResult.daysRemaining <= 7,
            soonestMessage: {
                id: soonestResult.message.id,
                title: (0, crypto_1.decryptMessageNullable)(soonestResult.message.title),
                recipientName: soonestResult.message.recipientName,
                deliveryChannel: soonestResult.message.deliveryChannel,
                triggerAfterDays: soonestResult.triggerThreshold,
                daysRemaining: soonestResult.daysRemaining,
            },
            isEncrypted: true,
            encryptionAlgorithm: "AES-256-GCM",
        };
    },
    updateUserById: async (id, data) => {
        return await prisma_1.default.user.update({
            where: {
                id,
            },
            data,
        });
    },
    updateUserByEmail: async (email, data) => {
        return await prisma_1.default.user.update({
            where: {
                email,
            },
            data,
        });
    },
    touchLastLogin: async (id) => {
        return await prisma_1.default.user.update({
            where: { id },
            data: {
                lastLoginAt: new Date(),
            },
        });
    },
};
exports.default = userServices;
