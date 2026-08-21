import { Prisma } from "@prisma/client";
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
