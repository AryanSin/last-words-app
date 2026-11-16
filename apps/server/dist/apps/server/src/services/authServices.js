"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const authServices = {
    createUser: async (data) => {
        return await prisma_1.default.user.create({
            data,
        });
    },
    findOrCreateGoogleUser: async (googleUser) => {
        let user = await prisma_1.default.user.findUnique({
            where: { googleId: googleUser.googleId },
        });
        if (user) {
            user = await prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                    avatarUrl: user.avatarUrl || googleUser.picture,
                    name: user.name || googleUser.name,
                    isEmailVerified: true,
                },
            });
            return user;
        }
        user = await prisma_1.default.user.findUnique({
            where: { email: googleUser.email },
        });
        if (user) {
            const existingProviders = user.authProviders || [];
            const updatedProviders = existingProviders.includes(client_1.AuthProvider.GOOGLE)
                ? existingProviders
                : [...existingProviders, client_1.AuthProvider.GOOGLE];
            user = await prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    googleId: googleUser.googleId,
                    lastLoginAt: new Date(),
                    avatarUrl: user.avatarUrl || googleUser.picture,
                    name: user.name || googleUser.name,
                    isEmailVerified: true,
                    authProviders: updatedProviders,
                },
            });
            return user;
        }
        return await prisma_1.default.user.create({
            data: {
                email: googleUser.email,
                name: googleUser.name || "Google User",
                googleId: googleUser.googleId,
                avatarUrl: googleUser.picture,
                isEmailVerified: true,
                authProviders: [client_1.AuthProvider.GOOGLE],
                lastLoginAt: new Date(),
            },
        });
    },
    findOrCreateWhatsAppUser: async (phoneNumber, name) => {
        let user = await prisma_1.default.user.findUnique({
            where: { phoneNumber },
        });
        if (user) {
            user = await prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                    name: name || user.name,
                    isPhoneVerified: true,
                },
            });
            return user;
        }
        return await prisma_1.default.user.create({
            data: {
                phoneNumber,
                name: name || "WhatsApp User",
                isPhoneVerified: true,
                authProviders: [client_1.AuthProvider.WHATSAPP],
                lastLoginAt: new Date(),
            },
        });
    },
};
exports.default = authServices;
