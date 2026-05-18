import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import prisma from "../config/prisma";
import AppError from "../utils/AppError";
import { generateToken } from "../utils/authUtility";
import SafeUser from "../utils/SafeUser";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name, age, email, password } = req.body as User;
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);
  const payload = {
    name,
    age,
    email,
    password: hashedPassword,
  };
  const user = await prisma.user.create({
    data: payload,
  });

  return res.status(201).json({
    status: "success",
    data: SafeUser(user),
    requestedAt: req.requestTime,
  });
};

export const handleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body as {
    email: string;
    password: string;
  };

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError("User does not exist", 409);
  }

  const safeUser = SafeUser(user);

  req.user = safeUser;

  const passwordMatched = await bcrypt.compare(
    password,
    user.password as string,
  );

  if (!passwordMatched) throw new AppError("Invalid Credentials", 401);

  const token = generateToken(safeUser);

  await prisma.user.update({
    where: {
      email: email,
    },
    data: {
      lastLoginAt: new Date(),
    },
  });

  return res.status(200).json({
    status: "success",
    data: token,
    requestedAt: req.requestTime,
  });
};
