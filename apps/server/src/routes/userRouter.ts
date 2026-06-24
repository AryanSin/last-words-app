import express from "express";
import {
  deleteUserById,
  getAllUsers,
  getMessagesByUserId,
  getUserById,
  getUsersCount,
  updateUserDefaultTrigger,
} from "../controllers/userController";

import { userDefaultTriggerUpdateSchema } from "@shared/schemas/userSchemas";
import validate from "../middleware/validate";
import { catchAsync } from "../utils/catchAsync";
import { loggerMiddlewareFunction, userLogger } from "../utils/loggers";

const userRouter = express.Router();

userRouter.route("/").get(catchAsync(getAllUsers));

userRouter.param("id", loggerMiddlewareFunction(userLogger));

userRouter.get("/count", catchAsync(getUsersCount));

userRouter.route("/:id/messages").get(catchAsync(getMessagesByUserId));

userRouter
  .route("/:id/default-trigger")
  .patch(
    validate(userDefaultTriggerUpdateSchema),
    catchAsync(updateUserDefaultTrigger),
  );

userRouter
  .route("/:id")
  .get(catchAsync(getUserById))
  .delete(catchAsync(deleteUserById));

export default userRouter;
