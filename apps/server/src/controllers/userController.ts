import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import { getPagination } from "../utils/pagination";
import { findSafeUserMany, findSafeUserUnique } from "../utils/SafeUser";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { age, name, email } = req.query;

  const users = await findSafeUserMany({
    where: {
      age: { equals: Number(age) || undefined },
      name: {
        contains: name ? String(name) : undefined,
        mode: "insensitive",
      },
      email: typeof email === "string" ? email : undefined,
    },
    orderBy: {
      createdAt: "desc",
    },
    ...getPagination(req),
  });
  return res.status(200).json({
    status: "success",
    data: users,
    requestedAt: req.requestTime,
  });
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);
  const user = await findSafeUserUnique({ where: { id: id } });

  return res
    .status(200)
    .json({ status: "success", data: user, requestedAt: req.requestTime });
};

export const deleteUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);

  await prisma.user.delete({
    where: { id },
  });

  return res.status(204).send();
};

export const getMessagesByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const id = Number(req.params.id);

  const messages = await prisma.user.findUnique({
    where: { id: id },
    select: {
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        ...getPagination(req),
      },
    },
  });
  return res.status(200).json({
    status: "success",
    data: messages?.messages,
    requestedAt: req.requestTime,
  });
};

export const getUsersCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const count = await prisma.user.count();
  return res.status(200).json({
    status: "success",
    data: count,
    requestedAt: req.requestTime,
  });
};
