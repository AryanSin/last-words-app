import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError";

export const validateMessageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { userId, content } = req.body as { userId?: number; content?: string };

  if (!content) throw new AppError("Message content cannot be empty!", 400);

  if (!userId) throw new AppError("UserId cannot be empty!", 400);

  next();
};
