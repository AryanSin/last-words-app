"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainLogger = exports.metricsLogger = exports.redisLogger = exports.messageJobLogger = exports.userLogger = exports.messageLogger = exports.authLogger = exports.logger = exports.createAppLogger = exports.httpLogger = exports.rawPinoLogger = void 0;
const crypto_1 = __importDefault(require("crypto"));
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const pino_pretty_1 = __importDefault(require("pino-pretty"));
const isDev = process.env.NODE_ENV !== "production";
exports.rawPinoLogger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
    base: {
        service: "last-words-api",
        env: process.env.NODE_ENV || "development",
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
}, isDev
    ? (0, pino_pretty_1.default)({
        colorize: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
        ignore: "pid,hostname",
        sync: true,
    })
    : undefined);
exports.httpLogger = (0, pino_http_1.default)({
    logger: exports.rawPinoLogger,
    genReqId: (req) => req.headers["x-request-id"] || crypto_1.default.randomUUID(),
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err)
            return "error";
        if (res.statusCode >= 400)
            return "warn";
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
const createAppLogger = (instance) => {
    const callMethod = (method, first, ...rest) => {
        if (typeof first === "string") {
            if (rest.length === 0) {
                instance[method](first);
            }
            else if (rest.length === 1 && rest[0] instanceof Error) {
                instance[method]({ err: rest[0] }, first);
            }
            else {
                instance[method]({ extra: rest }, first);
            }
        }
        else if (first instanceof Error) {
            const msg = typeof rest[0] === "string" ? rest[0] : first.message;
            instance[method]({ err: first }, msg);
        }
        else if (typeof first === "object" && first !== null) {
            const msg = typeof rest[0] === "string" ? rest[0] : "";
            instance[method](first, msg);
        }
        else {
            instance[method](String(first));
        }
    };
    return {
        info: (first, ...rest) => callMethod("info", first, ...rest),
        error: (first, ...rest) => callMethod("error", first, ...rest),
        warn: (first, ...rest) => callMethod("warn", first, ...rest),
        debug: (first, ...rest) => callMethod("debug", first, ...rest),
        child: (bindings) => (0, exports.createAppLogger)(instance.child(bindings)),
    };
};
exports.createAppLogger = createAppLogger;
exports.logger = (0, exports.createAppLogger)(exports.rawPinoLogger);
exports.authLogger = exports.logger.child({ module: "auth" });
exports.messageLogger = exports.logger.child({ module: "message" });
exports.userLogger = exports.logger.child({ module: "user" });
exports.messageJobLogger = exports.logger.child({ module: "jobs" });
exports.redisLogger = exports.logger.child({ module: "redis" });
exports.metricsLogger = exports.logger.child({ module: "metrics" });
exports.mainLogger = exports.logger.child({ module: "main" });
