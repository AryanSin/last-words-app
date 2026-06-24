import { Request, Response } from "express";
import messageServices from "../services/messageServices";
import successResponse from "../utils/successResponse";

export const getSystemMetrics = async (req: Request, res: Response) => {
  const metrics = await messageServices.getMessageMetrics();

  return successResponse(res, metrics, 200);
};
