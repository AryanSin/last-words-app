import { NextFunction, Request, Response } from "express";
import { getFileLogger } from "../middleware/loggerMiddleware";

const mainLogger = getFileLogger("logs/mainLogs.txt");
const errorLogger = getFileLogger("logs/errorLogs.txt");
const authLogger = getFileLogger("logs/auth.log");
const messageLogger = getFileLogger("logs/messageLogs.log");
const userLogger = getFileLogger("logs/userLogs.log");

const loggerFunction =
  (logger: (arg0: string) => void) =>
  (req: Request, res: Response, next: NextFunction) => {
    logger(
      `Method - ${req.method},  URL - ${req.url},   IP - ${req.ip},   id - ${req.params?.id},   params - ${JSON.stringify(req.params)},   body - ${JSON.stringify(req.body)}`,
    );
    next();
  };

export {
  authLogger,
  errorLogger,
  loggerFunction,
  mainLogger,
  messageLogger,
  userLogger,
};
