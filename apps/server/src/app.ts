import cors from "cors";
import express, { Request, Response } from "express";
import { authenticateToken } from "./middleware/authMiddleware";
import {
  globalErrorHandler,
  prismaErrorHandler,
} from "./middleware/errorMiddleware";
import { requestLimiter } from "./middleware/rateLimiterMiddleware";
import { addRequestTime } from "./middleware/requestBodyModificationMiddleWare";
import authRouter from "./routes/authRouter";
import jobRouter from "./routes/jobRouter";
import messageRouter from "./routes/messageRouter";
import metricsRouter from "./routes/metricRouter";
import userRouter from "./routes/userRouter";
import { catchAsync } from "./utils/catchAsync";
import { loggerMiddlewareFunction, mainLogger } from "./utils/loggers";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(loggerMiddlewareFunction(mainLogger));

app.use(addRequestTime);
app.use(requestLimiter);

// Health check and root route
app.get("/", (req: Request, res: Response) => {
  res.json({
    name: "Last Words API",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy", uptime: process.uptime() });
});

// Public Authentication & Job routes
app.use("/auth", authRouter);
app.use("/jobs", jobRouter);

// Protected routes (Require valid JWT Token)
app.use(catchAsync(authenticateToken));

app.use("/metrics", metricsRouter);
app.use("/users", userRouter);
app.use("/messages", messageRouter);

// Error Handling
app.use(prismaErrorHandler, globalErrorHandler);

export default app;
