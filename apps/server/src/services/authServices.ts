import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";

const authServices = {
  createUser: async (
    data: Prisma.XOR<Prisma.UserCreateInput, Prisma.UserUncheckedCreateInput>,
  ) => {
    return await prisma.user.create({
      data,
    });
  },
};

export default authServices;
