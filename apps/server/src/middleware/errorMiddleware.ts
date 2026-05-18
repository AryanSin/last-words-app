import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError";
import { errorLogger } from "../utils/loggers";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  // Handle known errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log error (important)
  errorLogger("Error 💥:" + err);
  console.error("ERROR 💥:", err);

  res.status(statusCode).json({
    status: "error",
    message,
  });
};

export const prismaErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err.code === "P2003") {
    return next(new AppError("client error (bad input)", 400));
  }
  if (err.code === "P2025") {
    return next(new AppError("User not found", 404));
  }

  return next(err);
};
