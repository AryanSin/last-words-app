import { MessageStatus, Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/library";
import { SwitchStatusDto } from "@shared/types/userTypes";
import prisma from "../config/prisma";
import AppError from "../utils/AppError";

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

  getUserSwitchStatus: async (userId: number): Promise<SwitchStatusDto> => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        lastLoginAt: true,
        defaultTriggerAfterDays: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const messages = await prisma.message.findMany({
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

    const pendingMessages = messages.filter((m) => m.status === MessageStatus.PENDING);
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
      };
    }

    // Find the soonest message to be triggered
    let soonest: {
      message: (typeof pendingMessages)[0];
      daysRemaining: number;
      triggerThreshold: number;
    } | null = null;

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

    const soonestResult = soonest!;

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
        title: soonestResult.message.title,
        recipientName: soonestResult.message.recipientName,
        deliveryChannel: soonestResult.message.deliveryChannel,
        triggerAfterDays: soonestResult.triggerThreshold,
        daysRemaining: soonestResult.daysRemaining,
      },
    };
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
