import { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Response {
      requestTime?: Date;
    }
  }
}
export const addRequestTime = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.requestTime = new Date();
  next();
};
