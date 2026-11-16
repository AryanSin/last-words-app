"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemMetrics = void 0;
const messageServices_1 = __importDefault(require("../services/messageServices"));
const successResponse_1 = __importDefault(require("../utils/successResponse"));
const getSystemMetrics = async (req, res) => {
    const metrics = await messageServices_1.default.getMessageMetrics();
    return (0, successResponse_1.default)(res, metrics, 200);
};
exports.getSystemMetrics = getSystemMetrics;
