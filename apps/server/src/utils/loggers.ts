import { NextFunction, Request, Response } from "express";
import { getFileLogger } from "../middleware/loggerMiddleware";

const mainLogger = getFileLogger("logs/mainLogs.txt");
const errorLogger = getFileLogger("logs/errorLogs.txt");
const authLogger = getFileLogger("logs/auth.log");
const messageLogger = getFileLogger("logs/messageLogs.log");
const userLogger = getFileLogger("logs/userLogs.log");
const messageJobLogger = getFileLogger("logs/messageJobsLogger.log");

const loggerMiddlewareFunction =
  (loggerFn: (arg0: string) => void) =>
  (req: Request, res: Response, next: NextFunction) => {
    loggerFn(
      `Method - ${req.method},  URL - ${req.url},   IP - ${req.ip},   id - ${req.params?.id},   params - ${JSON.stringify(req.params)},   body - ${JSON.stringify(req.body)}`,
    );
    next();
  };

const logger = {
  info: (...args: unknown[]) => {
    console.log("[INFO]", ...args);
  },

  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
  },

  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },
};

export {
  authLogger,
  errorLogger,
  logger,
  loggerMiddlewareFunction,
  mainLogger,
  messageJobLogger,
  messageLogger,
  userLogger,
};
