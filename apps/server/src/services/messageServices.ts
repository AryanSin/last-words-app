import { Message, Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import prisma from "../config/prisma";
import {
  decryptMessageList,
  decryptMessageObject,
  encryptMessage,
  encryptMessageNullable,
} from "../utils/crypto";

const messageServices = {
  getMessages: async (messageProps: {
    select?: Prisma.MessageSelect<DefaultArgs> | null | undefined;
    omit?: Prisma.MessageOmit<DefaultArgs> | null | undefined;
    include?: Prisma.MessageInclude<DefaultArgs> | null | undefined;
    where?: Prisma.MessageWhereInput;
    orderBy?: Prisma.MessageOrderByWithRelationInput;
    take?: number;
    skip?: number;
  }) => {
    const messages = await prisma.message.findMany({
      ...messageProps,
      include: messageProps.include || { deliveryEvents: true },
    });
    return decryptMessageList(messages);
  },

  // Pending messages first ordered by trigger proximity, followed by resolved messages
  getMessagesSortedByUrgency: async ({
    userId,
    take = 10,
    skip = 0,
  }: {
    userId: number;
    take?: number;
    skip?: number;
  }) => {
    const rawMessages = await prisma.$queryRaw<
      Array<
        Message & {
          userDefaultTriggerAfterDays: number;
          userLastLoginAt: Date;
          daysRemaining: number;
          deliveryEvents: any[];
        }
      >
    >`
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

    return decryptMessageList(rawMessages);
  },

  getMessagesCountByUserId: async (userId: number) => {
    return await prisma.message.count({
      where: { userId },
    });
  },

  createMessage: async (
    data: Prisma.XOR<
      Prisma.MessageCreateInput,
      Prisma.MessageUncheckedCreateInput
    >,
  ) => {
    const encryptedData = {
      ...data,
      content:
        typeof data.content === "string"
          ? encryptMessage(data.content)
          : data.content,
      title:
        typeof data.title === "string"
          ? encryptMessageNullable(data.title)
          : data.title,
    };

    const message = await prisma.message.create({
      data: encryptedData as any,
      include: {
        deliveryEvents: true,
      },
    });

    return decryptMessageObject(message);
  },

  getMessageById: async (id: number) => {
    const message = await prisma.message.findUniqueOrThrow({
      where: { id },
      include: {
        deliveryEvents: true,
      },
    });

    return decryptMessageObject(message);
  },

  getMessageByIdAndUserId: async (id: number, userId: number) => {
    const message = await prisma.message.findFirst({
      where: { id, userId },
      include: {
        deliveryEvents: true,
      },
    });

    return message ? decryptMessageObject(message) : null;
  },

  deleteMessageById: async (id: number) => {
    return await prisma.message.delete({
      where: { id },
    });
  },

  updateMessage: async (
    id: number,
    data: Prisma.XOR<
      Prisma.MessageUpdateInput,
      Prisma.MessageUncheckedUpdateInput
    >,
  ) => {
    const encryptedData = {
      ...data,
      ...(typeof data.content === "string"
        ? { content: encryptMessage(data.content) }
        : {}),
      ...(typeof data.title === "string"
        ? { title: encryptMessageNullable(data.title) }
        : {}),
    };

    const message = await prisma.message.update({
      where: { id },
      data: encryptedData as any,
      include: {
        deliveryEvents: true,
      },
    });

    return decryptMessageObject(message);
  },

  getMessageMetrics: async () => {
    return await prisma.systemMetric.findFirst();
  },
};

export default messageServices;
