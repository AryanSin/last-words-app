"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPagination = void 0;
const getPagination = (req, defaultLimit = 10, maxLimit = 100) => {
    const page = Math.max(1, parseInt(req.query.page || "1", 10) || 1);
    const rawLimit = parseInt(req.query.limit || req.query.size || String(defaultLimit), 10) || defaultLimit;
    const limit = Math.min(Math.max(1, rawLimit), maxLimit);
    const skip = (page - 1) * limit;
    return { take: limit, skip, page, limit };
};
exports.getPagination = getPagination;
