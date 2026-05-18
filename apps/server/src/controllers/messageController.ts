import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import { getPagination } from "../utils/pagination";

export const getAllMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: {
        createdAt: "desc",
      },
      ...getPagination(req),
    });
    return res.status(200).json({
      status: "success",
      data: messages,
      requestedAt: req.requestTime,
    });
  } catch (err) {
    return next(err);
  }
};

export const createMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { userId, content } = req.body as { userId: number; content: string };
  try {
    const message = await prisma.message.create({
      data: { content, userId },
    });
    return res.status(201).json({
      status: "success",
      data: message,
      requestedAt: req.requestTime,
    });
  } catch (err: any) {
    return next(err);
  }
};

export const getMessageById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);
    const message = await prisma.message.findUniqueOrThrow({
      where: { id: id },
    });

    return res
      .status(200)
      .json({ status: "success", data: message, requestedAt: req.requestTime });
  } catch (err) {
    return next(err);
  }
};

export const deleteMessageByMessageId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);
  try {
    await prisma.message.delete({ where: { id: id } });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};
