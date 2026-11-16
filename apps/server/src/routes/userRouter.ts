import {
  deletePushTokenSchema,
  registerPushTokenSchema,
  updateUserProfileSchema,
  userDefaultTriggerUpdateSchema,
  verifyPasswordSchema,
} from "@shared/schemas/userSchemas";
import express from "express";
import {
  checkInCurrentUser,
  deleteUserById,
  getAllUsers,
  getCurrentUser,
  getCurrentUserSwitchStatus,
  getMessagesByUserId,
  getUserById,
  getUsersCount,
  registerPushToken,
  removePushToken,
  updateCurrentUser,
  updateUserDefaultTrigger,
  verifyCurrentUserPassword,
} from "../controllers/userController";
import userRateLimiter from "../middleware/rateLimiter/userRateLimiter";
import validate from "../middleware/validate";
import { catchAsync } from "../utils/catchAsync";
import { loggerMiddlewareFunction, userLogger } from "../utils/loggers";

const userRouter = express.Router();

userRouter.use(userRateLimiter);

userRouter
  .route("/me")
  .get(catchAsync(getCurrentUser))
  .patch(validate(updateUserProfileSchema), catchAsync(updateCurrentUser));

userRouter.get("/switch-status", catchAsync(getCurrentUserSwitchStatus));
userRouter.get("/me/switch-status", catchAsync(getCurrentUserSwitchStatus));

userRouter.post("/check-in", catchAsync(checkInCurrentUser));
userRouter.post(
  "/verify-password",
  validate(verifyPasswordSchema),
  catchAsync(verifyCurrentUserPassword),
);

userRouter.post(
  "/push-token",
  validate(registerPushTokenSchema),
  catchAsync(registerPushToken),
);

userRouter.delete(
  "/push-token",
  validate(deletePushTokenSchema),
  catchAsync(removePushToken),
);

userRouter.route("/").get(catchAsync(getAllUsers));

userRouter.get("/count", catchAsync(getUsersCount));

userRouter.route("/:id/messages").get(catchAsync(getMessagesByUserId));

userRouter
  .route("/:id/default-trigger")
  .patch(
    validate(userDefaultTriggerUpdateSchema),
    catchAsync(updateUserDefaultTrigger),
  );

userRouter.param("id", loggerMiddlewareFunction(userLogger));

userRouter
  .route("/:id")
  .get(catchAsync(getUserById))
  .delete(catchAsync(deleteUserById));

export default userRouter;
