"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRequestTime = void 0;
const addRequestTime = (req, res, next) => {
    res.requestTime = new Date();
    next();
};
exports.addRequestTime = addRequestTime;
