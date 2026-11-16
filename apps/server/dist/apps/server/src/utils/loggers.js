"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userLogger = exports.redisLogger = exports.metricsLogger = exports.messageLogger = exports.messageJobLogger = exports.mainLogger = exports.loggerMiddlewareFunction = exports.logger = exports.errorLogger = exports.authLogger = void 0;
const logger_1 = require("./logger");
// Compatibility wrapper function that logs with structured Pino child logger
const createCompatLogger = (childLogger) => {
    const fn = (message, ...args) => {
        if (args.length > 0) {
            childLogger.info({ extra: args }, message);
        }
        else {
            childLogger.info(message);
        }
    };
    return fn;
};
const mainLogger = createCompatLogger(logger_1.mainLogger);
exports.mainLogger = mainLogger;
const errorLogger = (message, ...args) => {
    logger_1.logger.error({ extra: args }, message);
};
exports.errorLogger = errorLogger;
const authLogger = createCompatLogger(logger_1.authLogger);
exports.authLogger = authLogger;
const messageLogger = createCompatLogger(logger_1.messageLogger);
exports.messageLogger = messageLogger;
const userLogger = createCompatLogger(logger_1.userLogger);
exports.userLogger = userLogger;
const messageJobLogger = createCompatLogger(logger_1.messageJobLogger);
exports.messageJobLogger = messageJobLogger;
const redisLogger = createCompatLogger(logger_1.redisLogger);
exports.redisLogger = redisLogger;
const metricsLogger = createCompatLogger(logger_1.metricsLogger);
exports.metricsLogger = metricsLogger;
const loggerMiddlewareFunction = (loggerFn) => (req, res, next) => {
    loggerFn(`${req.method} ${req.originalUrl || req.url} - IP: ${req.ip} - params: ${JSON.stringify(req.params)}`);
    next();
};
exports.loggerMiddlewareFunction = loggerMiddlewareFunction;
const logger = logger_1.logger;
exports.logger = logger;
