import { Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import prisma from "../config/prisma";

const userServices = {
  checkUserExistsById: async (id: number) => {
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });
    return !!user;
  },

  getUserById: async (id: number) => {
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    return user;
  },

  getUserByEmail: async (email: string) => {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    return user;
  },

  getUsers: async (usersProps: {
    select?: Prisma.UserSelect<DefaultArgs> | null | undefined;
    omit?: Prisma.UserOmit<DefaultArgs> | null | undefined;
    include?: Prisma.UserInclude<DefaultArgs> | null | undefined;
    where?: Prisma.UserWhereUniqueInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    take?: number;
    skip?: number;
  }) => {
    const users = await prisma.user.findMany(usersProps);
    return users;
  },

  getUsersCount: async () => {
    return await prisma.user.count();
  },

  deleteUserById: async (id: number) => {
    return await prisma.user.delete({ where: { id } });
  },

  getMessagesByUserId: async (
    id: number,
    messageProps: {
      orderBy?: Prisma.MessageOrderByWithRelationInput;
      skip?: number;
      take?: number;
    },
  ) => {
    return await prisma.user.findUnique({
      where: { id: id },
      select: {
        messages: messageProps,
      },
    });
  },

  updateUserById: async (
    id: number,
    data: Prisma.XOR<Prisma.UserUpdateInput, Prisma.UserUncheckedUpdateInput>,
  ) => {
    return await prisma.user.update({
      where: {
        id,
      },
      data,
    });
  },

  updateUserByEmail: async (
    email: string,
    data: Prisma.XOR<Prisma.UserUpdateInput, Prisma.UserUncheckedUpdateInput>,
  ) => {
    return await prisma.user.update({
      where: {
        email,
      },
      data,
    });
  },
};

export default userServices;
