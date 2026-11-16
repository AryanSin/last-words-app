"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const swaggerRouter = (0, express_1.Router)();
try {
    const swaggerDocument = yamljs_1.default.load(path_1.default.join(__dirname, "openapi.yaml"));
    swaggerRouter.use("/", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument, {
        customSiteTitle: "Last Words API Documentation",
    }));
}
catch (err) {
    console.error("Failed to load OpenAPI definition:", err);
}
exports.default = swaggerRouter;
