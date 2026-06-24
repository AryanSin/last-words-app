import { userDefaultTriggerUpdateType } from "@shared/types/apiTypes";
import { userDto } from "@shared/types/userTypes";
import { NextFunction, Request, Response } from "express";
import { toMessageResponseDtoWithMessageStatus } from "../dto/messageDto";
import { toUserResponseDtoMinimal } from "../dto/userDto";
import userServices from "../services/userServices";
import AppError from "../utils/AppError";
import { getPagination } from "../utils/pagination";
import successResponse from "../utils/successResponse";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    name,
    email,
    sort = "createdAt,desc",
  } = req.query as {
    name: string;
    email: string;
    sort: string;
  };

  const users = await userServices.getUsers({
    where: {
      name: {
        contains: name ? String(name) : undefined,
        mode: "insensitive",
      },
      email: typeof email === "string" ? email : undefined,
    },
    orderBy: Object.fromEntries([sort.split(",")]),
    ...getPagination(req),
  });
  return successResponse(res, users.map(toUserResponseDtoMinimal), 200);
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);
  const user = await userServices.getUserById(id);

  if (!user) throw new AppError("User not found!", 404);

  return successResponse(res, toUserResponseDtoMinimal(user) as userDto, 200);
};

export const deleteUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);

  await userServices.deleteUserById(id);

  return res.status(204).send();
};

export const getMessagesByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);

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

export const getUsersCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const count = await userServices.getUsersCount();
  return successResponse(res, count, 200);
};

export const updateUserDefaultTrigger = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const data = req.parsedData as userDefaultTriggerUpdateType;
  const id = Number(req.params.id);
  const user = await userServices.updateUserById(id, data);

  return successResponse(res, toUserResponseDtoMinimal(user), 200);
};
