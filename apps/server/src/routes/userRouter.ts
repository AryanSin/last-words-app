import express from "express";
import {
  deleteUserById,
  getAllUsers,
  getMessagesByUserId,
  getUserById,
  getUsersCount,
} from "../controllers/userController";

import { catchAsync } from "../utils/catchAsync";
import { loggerFunction, userLogger } from "../utils/loggers";

const userRouter = express.Router();

userRouter.route("/").get(catchAsync(getAllUsers));

userRouter.param("id", loggerFunction(userLogger));

userRouter.get("/count", catchAsync(getUsersCount));

userRouter.route("/:id/messages").get(catchAsync(getMessagesByUserId));

userRouter
  .route("/:id")
  .get(catchAsync(getUserById))
  .delete(catchAsync(deleteUserById));

export default userRouter;
