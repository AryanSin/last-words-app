import { NextFunction, Request, Response } from "express";
import z from "zod";

declare global {
  namespace Express {
    interface Request {
      parsedData?: unknown;
    }
  }
}

const validate =
  (validationSchema: z.ZodObject<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = validationSchema.safeParse(req.body);

    if (!result.success) {
      const singleStringError = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      return res.status(400).json({
        status: "fail",
        message: singleStringError,
      });
    }

    req.parsedData = result.data;

    next();
  };

export default validate;
