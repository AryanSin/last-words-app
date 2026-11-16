"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const successResponse = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
        status: "success",
        data: data,
        requestedAt: res.requestTime,
    });
};
exports.default = successResponse;
