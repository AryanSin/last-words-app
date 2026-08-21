import {
  updateUserProfileSchema,
  userDefaultTriggerUpdateSchema,
} from "@shared/schemas/userSchemas";
import express from "express";
import {
  checkInCurrentUser,
  deleteUserById,
  getAllUsers,
  getCurrentUser,
  getMessagesByUserId,
  getUserById,
  getUsersCount,
  updateCurrentUser,
  updateUserDefaultTrigger,
} from "../controllers/userController";
import validate from "../middleware/validate";
import { catchAsync } from "../utils/catchAsync";
import { loggerMiddlewareFunction, userLogger } from "../utils/loggers";

const userRouter = express.Router();

// Current User Profile & Check-in routes
userRouter
  .route("/me")
  .get(catchAsync(getCurrentUser))
  .patch(validate(updateUserProfileSchema), catchAsync(updateCurrentUser));

userRouter.post("/check-in", catchAsync(checkInCurrentUser));

// Collection routes
userRouter.route("/").get(catchAsync(getAllUsers));

userRouter.get("/count", catchAsync(getUsersCount));

userRouter.route("/:id/messages").get(catchAsync(getMessagesByUserId));

userRouter
  .route("/:id/default-trigger")
  .patch(
    validate(userDefaultTriggerUpdateSchema),
    catchAsync(updateUserDefaultTrigger),
  );

// Individual User Parameter Middleware & Routes
userRouter.param("id", loggerMiddlewareFunction(userLogger));

userRouter
  .route("/:id")
  .get(catchAsync(getUserById))
  .delete(catchAsync(deleteUserById));

export default userRouter;
