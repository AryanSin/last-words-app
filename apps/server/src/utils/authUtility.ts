import { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";

export const generateToken = (user: Pick<User, "id"> & Partial<Pick<User, "email" | "phoneNumber">>) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
    },
    JWT_SECRET,
    { expiresIn: "30d" },
  );
};
