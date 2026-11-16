"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const healthRouter = express_1.default.Router();
healthRouter
    .route("/")
    .get((req, res, next) => {
    return res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
    });
});
exports.default = healthRouter;
