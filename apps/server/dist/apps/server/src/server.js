"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const emailService_1 = require("./integrations/emailService");
const loggers_1 = require("./utils/loggers");
const startServer = async () => {
    try {
        // Initialize transactional email service for user OTPs & auth
        await (0, emailService_1.initializeEmailService)();
        const server = app_1.default.listen(env_1.PORT, () => {
            loggers_1.logger.info(`Last Words API server running on port ${env_1.PORT}`);
        });
        const shutdown = async (signal) => {
            loggers_1.logger.info(`Received ${signal}. Shutting down API server gracefully...`);
            server.close(async () => {
                loggers_1.logger.info("HTTP server closed.");
                process.exit(0);
            });
        };
        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    }
    catch (err) {
        loggers_1.logger.error("Server startup failed:", err);
    }
};
startServer();
