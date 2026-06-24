import { Prisma, User } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/client";
import prisma from "../config/prisma";

export type SafeUserType = Omit<User, "password">;

const SafeUser = (user: User) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

export const findUsersMany = async (findManyProps: {
  select?: Prisma.UserSelect<DefaultArgs> | null | undefined;
  omit?: Prisma.UserOmit<DefaultArgs> | null | undefined;
  include?: Prisma.UserInclude<DefaultArgs> | null | undefined;
  where: Prisma.UserWhereUniqueInput;
  orderBy?: Prisma.UserOrderByWithRelationInput;
  take?: number;
  skip?: number;
}) => {
  const users = await prisma.user.findMany(findManyProps);
  return users;
};

export const findUserUnique = async (findUniqueProps: {
  select?: Prisma.UserSelect<DefaultArgs> | null | undefined;
  omit?: Prisma.UserOmit<DefaultArgs> | null | undefined;
  include?: Prisma.UserInclude<DefaultArgs> | null | undefined;
  where: Prisma.UserWhereUniqueInput;
}) => {
  const user = await prisma.user.findUnique(findUniqueProps);
  return user;
};

export default SafeUser;
