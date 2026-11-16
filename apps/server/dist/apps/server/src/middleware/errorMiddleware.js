"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaErrorHandler = exports.globalErrorHandler = void 0;
const AppError_1 = __importDefault(require("../utils/AppError"));
const loggers_1 = require("../utils/loggers");
const globalErrorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Something went wrong";
    if (err instanceof AppError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
    }
    else if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Access token has expired. Please refresh your session.";
    }
    else if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid access token.";
    }
    (0, loggers_1.errorLogger)(err?.message || String(err));
    if (statusCode === 500) {
        console.error(err);
    }
    res.status(statusCode).json({
        status: statusCode >= 500 ? "error" : "fail",
        message,
    });
};
exports.globalErrorHandler = globalErrorHandler;
const prismaErrorHandler = (err, req, res, next) => {
    if (err.code === "P2003") {
        return next(new AppError_1.default("client error (bad input)", 400));
    }
    if (err.code === "P2025") {
        return next(new AppError_1.default("User not found", 404));
    }
    return next(err);
};
exports.prismaErrorHandler = prismaErrorHandler;
