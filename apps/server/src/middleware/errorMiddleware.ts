import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError";
import { errorLogger } from "../utils/loggers";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Access token has expired. Please refresh your session.";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid access token.";
  }

  errorLogger(err?.message || String(err));
  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    status: statusCode >= 500 ? "error" : "fail",
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
