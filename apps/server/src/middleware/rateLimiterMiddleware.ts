import { NextFunction, Request, Response } from "express";
import { MAX_REQUESTS, WINDOW_SIZE } from "../config/constants";
import { store } from "../models/userModels";
import AppError from "../utils/AppError";

export const requestLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip = req.ip ?? "unknown";
  const now = Date.now();

  let requests = store.get(ip) || [];

  requests = requests.filter(
    (timestamp: number) => now - timestamp < WINDOW_SIZE,
  );

  const resetTime = (requests[0] || now) + WINDOW_SIZE;
  const resetTimeInSeconds = Math.floor(resetTime / 1000);

  if (requests.length >= MAX_REQUESTS) {
    res.setHeader("Retry-After", Math.floor((resetTime - now) / 1000));
    res.setHeader("X-RateLimit-Reset", resetTimeInSeconds);
    throw new AppError("Too Many Requests!", 429);
  }

  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", MAX_REQUESTS - requests.length);
  res.setHeader("X-RateLimit-Reset", resetTimeInSeconds);

  requests.push(now);
  store.set(ip, requests);

  next();
};
