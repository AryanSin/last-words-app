import { Response } from "express";

const successResponse = (res: Response, data: any, statusCode = 200) => {
  return res.status(statusCode).json({
    status: "success",
    data: data,
    requestedAt: res.requestTime,
  });
};

export default successResponse;
