import {
  loginUserSchema,
  registerUserSchema,
} from "@shared/schemas/authSchemas";
import express from "express";
import { createUser, handleLogin } from "../controllers/authController";
import { validateRegisterInput } from "../middleware/authMiddleware";
import validate from "../middleware/validate";
import { catchAsync } from "../utils/catchAsync";
import { authLogger, loggerMiddlewareFunction } from "../utils/loggers";

const authRouter = express.Router();

authRouter.use(loggerMiddlewareFunction(authLogger));

authRouter
  .route("/register")
  .post(
    validate(registerUserSchema),
    catchAsync(validateRegisterInput),
    catchAsync(createUser),
  );

authRouter
  .route("/login")
  .post(catchAsync(validate(loginUserSchema)), catchAsync(handleLogin));

export default authRouter;
