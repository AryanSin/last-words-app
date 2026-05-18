import express from "express";
import { createUser, handleLogin } from "../controllers/authController";
import {
  validateLoginInput,
  validateRegisterInput,
} from "../middleware/authMiddleware";
import { catchAsync } from "../utils/catchAsync";
import { authLogger, loggerFunction } from "../utils/loggers";

const authRouter = express.Router();

authRouter.use(loggerFunction(authLogger));

authRouter
  .route("/register")
  .post(catchAsync(validateRegisterInput), catchAsync(createUser));

authRouter.route("/login").post(validateLoginInput, catchAsync(handleLogin));

export default authRouter;
