import { User } from "@prisma/client";
import { registerUserType } from "@shared/types/apiTypes";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";
import TokenPayload from "../interfaces/webTokenInterface";
import userServices from "../services/userServices";
import AppError from "../utils/AppError";

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
  const { email } = req.parsedData as registerUserType;

  const existingUser = await userServices.getUserByEmail(email);

  if (!!existingUser) {
    throw new AppError("Email already registered", 409);
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

  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
  const user = await userServices.getUserById(Number(decoded.id));

  if (!user) throw new AppError("User with given emailId not found", 404);
  req.user = user;

  next();
};
