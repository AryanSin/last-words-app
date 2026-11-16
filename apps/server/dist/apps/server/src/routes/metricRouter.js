"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const metricsController_1 = require("../controllers/metricsController");
const metricsRateLimiter_1 = __importDefault(require("../middleware/rateLimiter/metricsRateLimiter"));
const catchAsync_1 = require("../utils/catchAsync");
const metricsRouter = express_1.default.Router();
metricsRouter.use(metricsRateLimiter_1.default);
metricsRouter.route("/messages").get((0, catchAsync_1.catchAsync)(metricsController_1.getSystemMetrics));
exports.default = metricsRouter;
