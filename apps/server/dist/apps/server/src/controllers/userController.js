"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserDefaultTrigger = exports.getUsersCount = exports.getMessagesByUserId = exports.deleteUserById = exports.getUserById = exports.getAllUsers = exports.removePushToken = exports.registerPushToken = exports.verifyCurrentUserPassword = exports.checkInCurrentUser = exports.updateCurrentUser = exports.getCurrentUserSwitchStatus = exports.getCurrentUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const messageDto_1 = require("../dto/messageDto");
const userDto_1 = require("../dto/userDto");
const pushNotificationService_1 = __importDefault(require("../services/pushNotificationService"));
const userServices_1 = __importDefault(require("../services/userServices"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const loggers_1 = require("../utils/loggers");
const pagination_1 = require("../utils/pagination");
const successResponse_1 = __importDefault(require("../utils/successResponse"));
const getCurrentUser = async (req, res, next) => {
    const id = Number(req.user?.id);
    const user = await userServices_1.default.getUserById(id);
    if (!user)
        throw new AppError_1.default("User not found", 404);
    return (0, successResponse_1.default)(res, (0, userDto_1.toUserResponseDtoMinimal)(user), 200);
};
exports.getCurrentUser = getCurrentUser;
const getCurrentUserSwitchStatus = async (req, res, next) => {
    const id = Number(req.user?.id);
    if (!id)
        throw new AppError_1.default("Unauthorized", 401);
    const status = await userServices_1.default.getUserSwitchStatus(id);
    return (0, successResponse_1.default)(res, status, 200);
};
exports.getCurrentUserSwitchStatus = getCurrentUserSwitchStatus;
const updateCurrentUser = async (req, res, next) => {
    const id = Number(req.user?.id);
    const data = req.parsedData;
    // If email is changing, verify it's not taken
    if (data.email) {
        const existing = await userServices_1.default.getUserByEmail(data.email);
        if (existing && existing.id !== id) {
            throw new AppError_1.default("Email already in use by another account", 409);
        }
    }
    // If phone is changing, verify it's not taken
    if (data.phoneNumber) {
        const existing = await userServices_1.default.getUserByPhone(data.phoneNumber);
        if (existing && existing.id !== id) {
            throw new AppError_1.default("Phone number already in use by another account", 409);
        }
    }
    const updatedUser = await userServices_1.default.updateUserById(id, data);
    return (0, successResponse_1.default)(res, (0, userDto_1.toUserResponseDtoMinimal)(updatedUser), 200);
};
exports.updateCurrentUser = updateCurrentUser;
const checkInCurrentUser = async (req, res, next) => {
    const id = Number(req.user?.id);
    const { biometricVerified, authMethod } = (req.body || {});
    const updatedUser = await userServices_1.default.touchLastLogin(id);
    if (biometricVerified) {
        (0, loggers_1.userLogger)(`User ${id} checked in with verified biometric authentication`);
    }
    return (0, successResponse_1.default)(res, {
        message: biometricVerified
            ? "Biometric check-in verified! Inactivity timer reset."
            : "Check-in successful! Inactivity timer reset.",
        lastLoginAt: updatedUser.lastLoginAt,
        biometricVerified: Boolean(biometricVerified),
        authMethod: authMethod || (biometricVerified ? "BIOMETRIC" : "MANUAL"),
    }, 200);
};
exports.checkInCurrentUser = checkInCurrentUser;
const verifyCurrentUserPassword = async (req, res, next) => {
    const userId = Number(req.user?.id);
    const { password } = req.parsedData;
    if (!userId) {
        throw new AppError_1.default("Unauthorized", 401);
    }
    const user = await userServices_1.default.getUserById(userId);
    if (!user || !user.password) {
        throw new AppError_1.default("Account does not have a local password configured", 400);
    }
    const passwordMatched = await bcrypt_1.default.compare(password, user.password);
    if (!passwordMatched) {
        throw new AppError_1.default("Incorrect password", 401);
    }
    (0, loggers_1.userLogger)(`User ${userId} successfully authenticated password for security setting change`);
    return (0, successResponse_1.default)(res, {
        verified: true,
        message: "Password verified successfully",
    }, 200);
};
exports.verifyCurrentUserPassword = verifyCurrentUserPassword;
const registerPushToken = async (req, res, next) => {
    const userId = Number(req.user?.id);
    const { token, platform } = req.parsedData;
    if (!userId)
        throw new AppError_1.default("Unauthorized", 401);
    const device = await pushNotificationService_1.default.registerDeviceToken(userId, token, platform || "mobile");
    return (0, successResponse_1.default)(res, {
        message: "Push token registered successfully",
        token: device.token,
        platform: device.platform,
    }, 200);
};
exports.registerPushToken = registerPushToken;
const removePushToken = async (req, res, next) => {
    const userId = Number(req.user?.id);
    const { token } = req.parsedData;
    if (!userId)
        throw new AppError_1.default("Unauthorized", 401);
    await pushNotificationService_1.default.removeDeviceToken(userId, token);
    return (0, successResponse_1.default)(res, {
        message: "Push token removed successfully",
    }, 200);
};
exports.removePushToken = removePushToken;
const getAllUsers = async (req, res, next) => {
    const { name, email, sort = "createdAt,desc", } = req.query;
    const users = await userServices_1.default.getUsers({
        where: {
            name: name
                ? {
                    contains: String(name),
                    mode: "insensitive",
                }
                : undefined,
            email: typeof email === "string" ? email : undefined,
        },
        orderBy: Object.fromEntries([sort.split(",")]),
        ...(0, pagination_1.getPagination)(req),
    });
    return (0, successResponse_1.default)(res, users.map(userDto_1.toUserResponseDtoMinimal), 200);
};
exports.getAllUsers = getAllUsers;
const getUserById = async (req, res, next) => {
    const id = Number(req.params.id);
    const user = await userServices_1.default.getUserById(id);
    if (!user)
        throw new AppError_1.default("User not found!", 404);
    return (0, successResponse_1.default)(res, (0, userDto_1.toUserResponseDtoMinimal)(user), 200);
};
exports.getUserById = getUserById;
const deleteUserById = async (req, res, next) => {
    const id = Number(req.params.id);
    await userServices_1.default.deleteUserById(id);
    return res.status(204).send();
};
exports.deleteUserById = deleteUserById;
const getMessagesByUserId = async (req, res, next) => {
    const id = Number(req.params.id);
    const messages = await userServices_1.default.getMessagesByUserId(id, {
        orderBy: {
            createdAt: "desc",
        },
        ...(0, pagination_1.getPagination)(req),
    });
    return (0, successResponse_1.default)(res, messages?.messages?.map(messageDto_1.toMessageResponseDtoWithMessageStatus), 200);
};
exports.getMessagesByUserId = getMessagesByUserId;
const getUsersCount = async (req, res, next) => {
    const count = await userServices_1.default.getUsersCount();
    return (0, successResponse_1.default)(res, count, 200);
};
exports.getUsersCount = getUsersCount;
const updateUserDefaultTrigger = async (req, res, next) => {
    const data = req.parsedData;
    const id = Number(req.params.id);
    const user = await userServices_1.default.updateUserById(id, data);
    return (0, successResponse_1.default)(res, (0, userDto_1.toUserResponseDtoMinimal)(user), 200);
};
exports.updateUserDefaultTrigger = updateUserDefaultTrigger;
