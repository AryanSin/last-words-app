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

app.use(express.json());
app.use(loggerMiddlewareFunction(mainLogger));

app.use(addRequestTime);
app.use(requestLimiter);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Hello Aryan 👋" });
});

app.use("/auth", authRouter);

app.use("/jobs", jobRouter);

app.use(catchAsync(authenticateToken));

app.use("metrics", metricsRouter);

app.use("/users", userRouter);

app.use("/messages", messageRouter);

app.use(prismaErrorHandler, globalErrorHandler);

export default app;
