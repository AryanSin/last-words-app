"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate = (validationSchema) => (req, res, next) => {
    const result = validationSchema.safeParse(req.body);
    if (!result.success && result.error) {
        const singleStringError = result.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join(", ");
        return res.status(400).json({
            status: "fail",
            message: singleStringError,
        });
    }
    req.parsedData = result.data;
    next();
};
exports.default = validate;
