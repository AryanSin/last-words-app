import { MessageStatus } from "@prisma/client";
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
import AppError from "../utils/AppError";
import { getPagination } from "../utils/pagination";
import successResponse from "../utils/successResponse";

export const getAllMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = Number(req.user?.id);
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const { take, skip } = getPagination(req);
  const messages = await messageServices.getMessagesSortedByUrgency({
    userId,
    take,
    skip,
  });

  return successResponse(
    res,
    messages.map(toMessageResponseDtoWithMessageStatus as any),
    200,
  );
};

export const createMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const data = req.parsedData as messageCreationBodyType;
  const userId = Number(req.user?.id);

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const message = await messageServices.createMessage({
    title: data.title,
    content: data.content,
    recipientName: data.recipientName,
    recipientEmail: data.recipientEmail || null,
    recipientPhone: data.recipientPhone || null,
    deliveryChannel: data.deliveryChannel || "EMAIL",
    triggerAfterDays: data.triggerAfterDays,
    user: {
      connect: { id: userId },
    },
  });

  return successResponse(res, toMessageResponseDto(message), 201);
};

export const getUserMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = Number(req.user?.id);
  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  const { take, skip } = getPagination(req);
  const messages = await messageServices.getMessagesSortedByUrgency({
    userId,
    take,
    skip,
  });

  return successResponse(
    res,
    messages.map(toMessageResponseDtoWithMessageStatus as any),
    200,
  );
};

export const getMessageById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);
  const userId = Number(req.user?.id);

  const message = await messageServices.getMessageByIdAndUserId(id, userId);

  if (!message) {
    throw new AppError("Message not found", 404);
  }

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
  const userId = Number(req.user?.id);

  const message = await messageServices.getMessageByIdAndUserId(id, userId);
  if (!message) {
    throw new AppError("Message not found", 404);
  }

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
  const userId = Number(req.user?.id);

  const message = await messageServices.getMessageByIdAndUserId(id, userId);
  if (!message) {
    throw new AppError("Message not found", 404);
  }

  // Any message not in delivered (SENT) status is editable
  if (message.status === MessageStatus.SENT) {
    throw new AppError("Delivered messages cannot be edited", 400);
  }

  const updatedMessage = await messageServices.updateMessage(id, {
    title: data.title !== undefined ? data.title : message.title,
    content: data.content !== undefined ? data.content : message.content,
    recipientName:
      data.recipientName !== undefined
        ? data.recipientName
        : message.recipientName,
    recipientEmail:
      data.recipientEmail !== undefined
        ? data.recipientEmail || null
        : message.recipientEmail,
    recipientPhone:
      data.recipientPhone !== undefined
        ? data.recipientPhone || null
        : message.recipientPhone,
    deliveryChannel:
      data.deliveryChannel !== undefined
        ? data.deliveryChannel
        : message.deliveryChannel,
    triggerAfterDays:
      data.triggerAfterDays !== undefined
        ? data.triggerAfterDays
        : message.triggerAfterDays,
    // Reset failed messages to pending upon successful modification
    ...(message.status === MessageStatus.FAILED
      ? { status: MessageStatus.PENDING, failedAttempts: 0, lastError: null }
      : {}),
  });

  return successResponse(
    res,
    toMessageResponseDtoWithMessageStatus(updatedMessage),
    200,
  );
};
