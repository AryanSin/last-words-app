import app from "./app";
import { PORT } from "./config/env";
import { initializeEmailService } from "./integrations/emailService";
import { logger } from "./utils/loggers";

const startServer = async () => {
  try {
    // Initialize transactional email service for user OTPs & auth
    await initializeEmailService();

    const server = app.listen(PORT, () => {
      logger.info(`Last Words API server running on port ${PORT}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down API server gracefully...`);
      server.close(async () => {
        logger.info("HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error("Server startup failed:", err);
  }
};

startServer();
