import {
  messageCreationBodyType,
  updateMessageBodyType,
} from "@shared/types/apiTypes";
import { NextFunction, Request, Response } from "express";
import {
  toMessageResponseDto,
  toMessageResponseDtoWithMessageStatus,
} from "../dto/messageDto";
import messageServices from "../services/messageServices";
import userServices from "../services/userServices";
import { getPagination } from "../utils/pagination";
import successResponse from "../utils/successResponse";

export const getAllMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const messages = await messageServices.getMessages({
    orderBy: {
      createdAt: "desc",
    },
    ...getPagination(req),
  });
  return successResponse(
    res,
    messages.map(toMessageResponseDtoWithMessageStatus),
    200,
  );
};

export const createMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const data = req.parsedData as messageCreationBodyType;

  const message = await messageServices.createMessage(data);

  return successResponse(res, toMessageResponseDto(message), 201);
};

export const getUserMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.user?.id);

  const messages = await userServices.getMessagesByUserId(id, {
    orderBy: {
      createdAt: "desc",
    },
    ...getPagination(req),
  });

  return successResponse(
    res,
    messages?.messages?.map(toMessageResponseDtoWithMessageStatus),
    200,
  );
};

export const getMessageById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);
  const message = await messageServices.getMessageById(id);

  return successResponse(
    res,
    toMessageResponseDtoWithMessageStatus(message),
    200,
  );
};

export const deleteMessageByMessageId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);

  await messageServices.deleteMessageById(id);

  return res.status(204).send();
};

export const updateMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const data = req.parsedData as updateMessageBodyType;
  const id = Number(req.params.id);

  const message = await messageServices.updateMessage(id, data);

  return successResponse(res, toMessageResponseDto(message), 201);
};
