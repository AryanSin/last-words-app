import { AuthProvider, Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { GoogleUserInfo } from "../integrations/googleAuthService";

const authServices = {
  createUser: async (
    data: Prisma.XOR<Prisma.UserCreateInput, Prisma.UserUncheckedCreateInput>,
  ) => {
    return await prisma.user.create({
      data,
    });
  },

  findOrCreateGoogleUser: async (googleUser: GoogleUserInfo) => {
    // Check if user already exists by googleId
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    if (user) {
      // Update last login and profile info
      user = await prisma.user.update({
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

    // Check if user exists with matching email
    user = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (user) {
      // Link Google Account to existing user
      const existingProviders = user.authProviders || [];
      const updatedProviders = existingProviders.includes(AuthProvider.GOOGLE)
        ? existingProviders
        : [...existingProviders, AuthProvider.GOOGLE];

      user = await prisma.user.update({
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

    // Create new Google user
    return await prisma.user.create({
      data: {
        email: googleUser.email,
        name: googleUser.name || "Google User",
        googleId: googleUser.googleId,
        avatarUrl: googleUser.picture,
        isEmailVerified: true,
        authProviders: [AuthProvider.GOOGLE],
        lastLoginAt: new Date(),
      },
    });
  },

  findOrCreateWhatsAppUser: async (phoneNumber: string, name?: string) => {
    let user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          name: name || user.name,
          isPhoneVerified: true,
        },
      });
      return user;
    }

    return await prisma.user.create({
      data: {
        phoneNumber,
        name: name || "WhatsApp User",
        isPhoneVerified: true,
        authProviders: [AuthProvider.WHATSAPP],
        lastLoginAt: new Date(),
      },
    });
  },
};

export default authServices;
