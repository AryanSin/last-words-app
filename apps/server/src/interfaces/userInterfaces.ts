import { Prisma } from "@prisma/client";

type User = {
  id: number;
  name: string;
  email: string;
  password: string;
};

export type UserWithMessages = Prisma.UserGetPayload<{
  include: { messages: true };
}>;
