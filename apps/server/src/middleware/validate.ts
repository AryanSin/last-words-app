import { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      parsedData?: unknown;
    }
  }
}

export interface ParsableSchema {
  safeParse: (data: unknown) => {
    success: boolean;
    data?: any;
    error?: {
      issues: Array<{ path: (string | number)[]; message: string }>;
    };
  };
}

const validate =
  (validationSchema: ParsableSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = validationSchema.safeParse(req.body);

    if (!result.success && result.error) {
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
