import cors from "cors";
import express, { Request, Response } from "express";
import swaggerRouter from "./docs/swagger";
import { authenticateToken } from "./middleware/authMiddleware";
import {
  globalErrorHandler,
  prismaErrorHandler,
} from "./middleware/errorMiddleware";
import globalRateLimiter from "./middleware/rateLimiter/globalRateLimiter";
import { addRequestTime } from "./middleware/requestBodyModificationMiddleWare";
import authRouter from "./routes/authRouter";
import jobRouter from "./routes/jobRouter";
import messageRouter from "./routes/messageRouter";
import metricsRouter from "./routes/metricRouter";
import userRouter from "./routes/userRouter";
import { catchAsync } from "./utils/catchAsync";
import { httpLogger } from "./utils/logger";

const app = express();

app.use(cors());
app.use(express.json());
app.use(httpLogger);
app.use(addRequestTime);
app.use(globalRateLimiter);

app.use("/docs", swaggerRouter);

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

app.use("/jobs", jobRouter);
app.use("/auth", authRouter);

app.use(catchAsync(authenticateToken));

app.use("/metrics", metricsRouter);
app.use("/users", userRouter);
app.use("/messages", messageRouter);

app.use(prismaErrorHandler, globalErrorHandler);

export default app;
