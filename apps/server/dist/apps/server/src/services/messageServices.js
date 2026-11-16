"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../config/prisma"));
const crypto_1 = require("../utils/crypto");
const messageServices = {
    getMessages: async (messageProps) => {
        const messages = await prisma_1.default.message.findMany({
            ...messageProps,
            include: messageProps.include || { deliveryEvents: true },
        });
        return (0, crypto_1.decryptMessageList)(messages);
    },
    // Pending messages first ordered by trigger proximity, followed by resolved messages
    getMessagesSortedByUrgency: async ({ userId, take = 10, skip = 0, }) => {
        const rawMessages = await prisma_1.default.$queryRaw `
      SELECT 
        m."id",
        m."title",
        m."content",
        m."recipientName",
        m."recipientEmail",
        m."recipientPhone",
        m."deliveryChannel",
        m."userId",
        m."triggerAfterDays",
        m."status",
        m."sentAt",
        m."failedAttempts",
        m."lastError",
        m."createdAt",
        m."updatedAt",
        u."defaultTriggerAfterDays" AS "userDefaultTriggerAfterDays",
        u."lastLoginAt" AS "userLastLoginAt",
        GREATEST(
          0,
          CEIL(
            COALESCE(m."triggerAfterDays", u."defaultTriggerAfterDays", 365) - 
            (EXTRACT(EPOCH FROM (NOW() - COALESCE(u."lastLoginAt", u."createdAt", NOW()))) / 86400.0)
          )
        )::integer AS "daysRemaining",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', de."id",
                'messageId', de."messageId",
                'channel', de."channel",
                'recipient', de."recipient",
                'success', de."success",
                'error', de."error",
                'createdAt', de."createdAt"
              )
            )
            FROM "DeliveryEvent" de
            WHERE de."messageId" = m."id"
          ),
          '[]'::json
        ) AS "deliveryEvents"
      FROM "Message" m
      JOIN "User" u ON m."userId" = u."id"
      WHERE m."userId" = ${userId}
      ORDER BY
        CASE WHEN m."status" = 'PENDING' THEN 0 ELSE 1 END ASC,
        CASE WHEN m."status" = 'PENDING' THEN
          COALESCE(u."lastLoginAt", u."createdAt", NOW()) + (COALESCE(m."triggerAfterDays", u."defaultTriggerAfterDays", 365) * INTERVAL '1 day')
        END ASC,
        m."createdAt" DESC
      LIMIT ${take}
      OFFSET ${skip}
    `;
        return (0, crypto_1.decryptMessageList)(rawMessages);
    },
    getMessagesCountByUserId: async (userId) => {
        return await prisma_1.default.message.count({
            where: { userId },
        });
    },
    createMessage: async (data) => {
        const encryptedData = {
            ...data,
            content: typeof data.content === "string"
                ? (0, crypto_1.encryptMessage)(data.content)
                : data.content,
            title: typeof data.title === "string"
                ? (0, crypto_1.encryptMessageNullable)(data.title)
                : data.title,
        };
        const message = await prisma_1.default.message.create({
            data: encryptedData,
            include: {
                deliveryEvents: true,
            },
        });
        return (0, crypto_1.decryptMessageObject)(message);
    },
    getMessageById: async (id) => {
        const message = await prisma_1.default.message.findUniqueOrThrow({
            where: { id },
            include: {
                deliveryEvents: true,
            },
        });
        return (0, crypto_1.decryptMessageObject)(message);
    },
    getMessageByIdAndUserId: async (id, userId) => {
        const message = await prisma_1.default.message.findFirst({
            where: { id, userId },
            include: {
                deliveryEvents: true,
            },
        });
        return message ? (0, crypto_1.decryptMessageObject)(message) : null;
    },
    deleteMessageById: async (id) => {
        return await prisma_1.default.message.delete({
            where: { id },
        });
    },
    updateMessage: async (id, data) => {
        const encryptedData = {
            ...data,
            ...(typeof data.content === "string"
                ? { content: (0, crypto_1.encryptMessage)(data.content) }
                : {}),
            ...(typeof data.title === "string"
                ? { title: (0, crypto_1.encryptMessageNullable)(data.title) }
                : {}),
        };
        const message = await prisma_1.default.message.update({
            where: { id },
            data: encryptedData,
            include: {
                deliveryEvents: true,
            },
        });
        return (0, crypto_1.decryptMessageObject)(message);
    },
    getMessageMetrics: async () => {
        return await prisma_1.default.systemMetric.findFirst();
    },
};
exports.default = messageServices;
