import crypto from "crypto";
import pino from "pino";
import pinoHttp from "pino-http";

const isDev = process.env.NODE_ENV !== "production";

export const rawPinoLogger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    service: "last-words-api",
    env: process.env.NODE_ENV || "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const httpLogger = pinoHttp({
  logger: rawPinoLogger,
  genReqId: (req) =>
    (req.headers["x-request-id"] as string) || crypto.randomUUID(),
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} completed with status ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} failed with status ${res.statusCode}: ${err.message}`;
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      ip: req.headers["x-forwarded-for"] || req.remoteAddress,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});

export interface AppLogger {
  info(message: string, ...args: unknown[]): void;
  info(obj: object, message?: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  error(err: unknown, message?: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  warn(obj: unknown, message?: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
  debug(obj: unknown, message?: string, ...args: unknown[]): void;
  child(bindings: pino.Bindings): AppLogger;
}

export const createAppLogger = (instance: pino.Logger): AppLogger => {
  const callMethod = (
    method: "info" | "error" | "warn" | "debug",
    first: unknown,
    ...rest: unknown[]
  ) => {
    if (typeof first === "string") {
      if (rest.length === 0) {
        instance[method](first);
      } else if (rest.length === 1 && rest[0] instanceof Error) {
        instance[method]({ err: rest[0] }, first);
      } else {
        instance[method]({ extra: rest }, first);
      }
    } else if (first instanceof Error) {
      const msg = typeof rest[0] === "string" ? (rest[0] as string) : first.message;
      instance[method]({ err: first }, msg);
    } else if (typeof first === "object" && first !== null) {
      const msg = typeof rest[0] === "string" ? (rest[0] as string) : "";
      instance[method](first as object, msg);
    } else {
      instance[method](String(first));
    }
  };

  return {
    info: (first: any, ...rest: unknown[]) => callMethod("info", first, ...rest),
    error: (first: any, ...rest: unknown[]) => callMethod("error", first, ...rest),
    warn: (first: any, ...rest: unknown[]) => callMethod("warn", first, ...rest),
    debug: (first: any, ...rest: unknown[]) => callMethod("debug", first, ...rest),
    child: (bindings: pino.Bindings) => createAppLogger(instance.child(bindings)),
  };
};

export const logger = createAppLogger(rawPinoLogger);
export const authLogger = logger.child({ module: "auth" });
export const messageLogger = logger.child({ module: "message" });
export const userLogger = logger.child({ module: "user" });
export const messageJobLogger = logger.child({ module: "jobs" });
export const redisLogger = logger.child({ module: "redis" });
export const metricsLogger = logger.child({ module: "metrics" });
export const mainLogger = logger.child({ module: "main" });

