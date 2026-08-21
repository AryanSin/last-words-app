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
    return await prisma.user.findUnique({
      where: {
        id,
      },
    });
  },

  getUserByEmail: async (email: string) => {
    return await prisma.user.findUnique({
      where: {
        email,
      },
    });
  },

  getUserByPhone: async (phoneNumber: string) => {
    return await prisma.user.findUnique({
      where: {
        phoneNumber,
      },
    });
  },

  getUserByGoogleId: async (googleId: string) => {
    return await prisma.user.findUnique({
      where: {
        googleId,
      },
    });
  },

  getUsers: async (usersProps: {
    select?: Prisma.UserSelect<DefaultArgs> | null | undefined;
    omit?: Prisma.UserOmit<DefaultArgs> | null | undefined;
    include?: Prisma.UserInclude<DefaultArgs> | null | undefined;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    take?: number;
    skip?: number;
  }) => {
    return await prisma.user.findMany(usersProps);
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

  touchLastLogin: async (id: number) => {
    return await prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  },
};

export default userServices;
