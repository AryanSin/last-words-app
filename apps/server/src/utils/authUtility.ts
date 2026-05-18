import { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";

export const generateToken = (user: Omit<User, "password">) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
};
