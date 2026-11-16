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
    throw new AppError("Unauthorized. No token provided.", 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const user = await userServices.getUserById(Number(decoded.id));

    if (!user) {
      throw new AppError("User account not found", 404);
    }

    req.user = user;
    req.userId = user.id;

    next();
  } catch (err: any) {
    if (err instanceof AppError) {
      return next(err);
    }
    if (err.name === "TokenExpiredError") {
      return next(
        new AppError("Access token has expired. Please refresh session.", 401),
      );
    }
    if (err.name === "JsonWebTokenError") {
      return next(new AppError("Invalid access token", 401));
    }
    return next(err);
  }
};

export const optionalAuthenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const user = await userServices.getUserById(Number(decoded.id));

    if (user) {
      req.user = user;
      req.userId = user.id;
    }

    next();
  } catch {
    // In optional mode, proceed even if token is missing or expired
    next();
  }
};

