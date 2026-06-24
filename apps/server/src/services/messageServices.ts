import { Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import prisma from "../config/prisma";

const messageServices = {
  getMessages: async (messageProps: {
    select?: Prisma.MessageSelect<DefaultArgs> | null | undefined;
    omit?: Prisma.MessageOmit<DefaultArgs> | null | undefined;
    include?: Prisma.MessageInclude<DefaultArgs> | null | undefined;
    where?: Prisma.MessageWhereUniqueInput;
    orderBy?: Prisma.MessageOrderByWithRelationInput;
    take?: number;
    skip?: number;
  }) => {
    const messages = await prisma.message.findMany(messageProps);
    return messages;
  },

  createMessage: async (
    data: Prisma.XOR<
      Prisma.MessageCreateInput,
      Prisma.MessageUncheckedCreateInput
    >,
  ) => {
    return await prisma.message.create({
      data,
    });
  },

  getMessageById: async (id: number) => {
    return await prisma.message.findUniqueOrThrow({
      where: { id: id },
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
    });
  },

  getMessageMetrics: async () => {
    return await prisma.systemMetric.findFirst();
  },
};

export default messageServices;
