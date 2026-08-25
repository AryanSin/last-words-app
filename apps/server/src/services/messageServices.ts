import { Message, Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import prisma from "../config/prisma";

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
    return await prisma.message.findMany({
      ...messageProps,
      include: messageProps.include || { deliveryEvents: true },
    });
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

    return rawMessages;
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
    return await prisma.message.create({
      data,
      include: {
        deliveryEvents: true,
      },
    });
  },

  getMessageById: async (id: number) => {
    return await prisma.message.findUniqueOrThrow({
      where: { id },
      include: {
        deliveryEvents: true,
      },
    });
  },

  getMessageByIdAndUserId: async (id: number, userId: number) => {
    return await prisma.message.findFirst({
      where: { id, userId },
      include: {
        deliveryEvents: true,
      },
    });
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
    return await prisma.message.update({
      where: { id },
      data,
      include: {
        deliveryEvents: true,
      },
    });
  },

  getMessageMetrics: async () => {
    return await prisma.systemMetric.findFirst();
  },
};

export default messageServices;
