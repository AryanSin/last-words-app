"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userSchemas_1 = require("@shared/schemas/userSchemas");
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const userRateLimiter_1 = __importDefault(require("../middleware/rateLimiter/userRateLimiter"));
const validate_1 = __importDefault(require("../middleware/validate"));
const catchAsync_1 = require("../utils/catchAsync");
const loggers_1 = require("../utils/loggers");
const userRouter = express_1.default.Router();
userRouter.use(userRateLimiter_1.default);
userRouter
    .route("/me")
    .get((0, catchAsync_1.catchAsync)(userController_1.getCurrentUser))
    .patch((0, validate_1.default)(userSchemas_1.updateUserProfileSchema), (0, catchAsync_1.catchAsync)(userController_1.updateCurrentUser));
userRouter.get("/switch-status", (0, catchAsync_1.catchAsync)(userController_1.getCurrentUserSwitchStatus));
userRouter.get("/me/switch-status", (0, catchAsync_1.catchAsync)(userController_1.getCurrentUserSwitchStatus));
userRouter.post("/check-in", (0, catchAsync_1.catchAsync)(userController_1.checkInCurrentUser));
userRouter.post("/verify-password", (0, validate_1.default)(userSchemas_1.verifyPasswordSchema), (0, catchAsync_1.catchAsync)(userController_1.verifyCurrentUserPassword));
userRouter.post("/push-token", (0, validate_1.default)(userSchemas_1.registerPushTokenSchema), (0, catchAsync_1.catchAsync)(userController_1.registerPushToken));
userRouter.delete("/push-token", (0, validate_1.default)(userSchemas_1.deletePushTokenSchema), (0, catchAsync_1.catchAsync)(userController_1.removePushToken));
userRouter.route("/").get((0, catchAsync_1.catchAsync)(userController_1.getAllUsers));
userRouter.get("/count", (0, catchAsync_1.catchAsync)(userController_1.getUsersCount));
userRouter.route("/:id/messages").get((0, catchAsync_1.catchAsync)(userController_1.getMessagesByUserId));
userRouter
    .route("/:id/default-trigger")
    .patch((0, validate_1.default)(userSchemas_1.userDefaultTriggerUpdateSchema), (0, catchAsync_1.catchAsync)(userController_1.updateUserDefaultTrigger));
userRouter.param("id", (0, loggers_1.loggerMiddlewareFunction)(loggers_1.userLogger));
userRouter
    .route("/:id")
    .get((0, catchAsync_1.catchAsync)(userController_1.getUserById))
    .delete((0, catchAsync_1.catchAsync)(userController_1.deleteUserById));
exports.default = userRouter;
