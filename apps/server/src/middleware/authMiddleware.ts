import { User } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";
import TokenPayload from "../interfaces/webTokenInterface";
import AppError from "../utils/AppError";
import { findSafeUserUnique } from "../utils/SafeUser";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: Omit<User, "password">;
    }
  }
}

export const validateRegisterInput = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name, age, password, email } = req.body as {
    name?: string;
    age?: number;
    password?: string;
    email?: string;
  };

  if (!name || !age || !password || !email) {
    throw new AppError("Please enter all mandatory fields", 400);
  }

  try {
    const existingUser = await findSafeUserUnique({
      where: { email },
    });

    if (!!existingUser) {
      throw new AppError("Email already registered", 409);
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const validateLoginInput = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { password, email } = req.body as {
    password?: string;
    email?: string;
  };

  if (!password || !email) {
    throw new AppError("Please enter all mandatory fields", 400);
  }

  next();
};

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized. No token provided.",
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const user = await findSafeUserUnique({
      where: {
        id: Number(decoded.id),
      },
    });

    if (!user) throw new AppError("User with given emailId not found", 404);
    req.user = user;

    next();
  } catch (error) {
    return res.status(403).json({
      message: "Forbidden - Invalid or expired token",
    });
  }
};
