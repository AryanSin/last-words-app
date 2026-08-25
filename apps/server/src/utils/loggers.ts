import { NextFunction, Request, Response } from "express";
import {
  authLogger as pinoAuthLogger,
  logger as rootLogger,
  mainLogger as pinoMainLogger,
  messageJobLogger as pinoMessageJobLogger,
  messageLogger as pinoMessageLogger,
  metricsLogger as pinoMetricsLogger,
  redisLogger as pinoRedisLogger,
  userLogger as pinoUserLogger,
} from "./logger";

// Compatibility wrapper function that logs with structured Pino child logger
const createCompatLogger = (childLogger: typeof rootLogger) => {
  const fn = (message: string, ...args: unknown[]) => {
    if (args.length > 0) {
      childLogger.info({ extra: args }, message);
    } else {
      childLogger.info(message);
    }
  };
  return fn;
};

const mainLogger = createCompatLogger(pinoMainLogger);
const errorLogger = (message: string, ...args: unknown[]) => {
  rootLogger.error({ extra: args }, message);
};
const authLogger = createCompatLogger(pinoAuthLogger);
const messageLogger = createCompatLogger(pinoMessageLogger);
const userLogger = createCompatLogger(pinoUserLogger);
const messageJobLogger = createCompatLogger(pinoMessageJobLogger);
const redisLogger = createCompatLogger(pinoRedisLogger);
const metricsLogger = createCompatLogger(pinoMetricsLogger);

const loggerMiddlewareFunction =
  (loggerFn: (arg0: string) => void) =>
  (req: Request, res: Response, next: NextFunction) => {
    loggerFn(
      `${req.method} ${req.originalUrl || req.url} - IP: ${req.ip} - params: ${JSON.stringify(req.params)}`,
    );
    next();
  };

const logger = rootLogger;

export {
  authLogger,
  errorLogger,
  logger,
  loggerMiddlewareFunction,
  mainLogger,
  messageJobLogger,
  messageLogger,
  metricsLogger,
  redisLogger,
  userLogger,
};

