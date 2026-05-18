import { Prisma, User } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/client";
import prisma from "../config/prisma";

const SafeUser = (user: User) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const findSafeUserMany = async (findManyProps = {}) => {
  const users = await prisma.user.findMany(findManyProps);
  return users.map(SafeUser);
};

export const findSafeUserUnique = async (findUniqueProps: {
  select?: Prisma.UserSelect<DefaultArgs> | null | undefined;
  omit?: Prisma.UserOmit<DefaultArgs> | null | undefined;
  include?: Prisma.UserInclude<DefaultArgs> | null | undefined;
  where: Prisma.UserWhereUniqueInput;
}) => {
  const user = await prisma.user.findUnique(findUniqueProps);
  if (!user) return user;
  return SafeUser(user);
};

export default SafeUser;
