import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      requestTime?: Date;
    }
  }
}
export const addRequestTime = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.requestTime = new Date();
  next();
};
