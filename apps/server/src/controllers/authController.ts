import { loginUserType, registerUserType } from "@shared/types/apiTypes";
import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { toUserResponseDto, toUserResponseDtoMinimal } from "../dto/userDto";
import authServices from "../services/authServices";
import userServices from "../services/userServices";
import AppError from "../utils/AppError";
import { generateToken } from "../utils/authUtility";
import successResponse from "../utils/successResponse";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name, email, password } = req.body as registerUserType;
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await authServices.createUser({
    name,
    email,
    password: hashedPassword,
  });

  return successResponse(res, toUserResponseDtoMinimal(user), 201);
};

export const handleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.parsedData as loginUserType;

  const user = await userServices.getUserByEmail(email);

  if (!user) {
    throw new AppError("User does not exist", 409);
  }

  const safeUser = toUserResponseDto(user);

  req.user = safeUser;

  const passwordMatched = await bcrypt.compare(
    password,
    user.password as string,
  );

  if (!passwordMatched) throw new AppError("Invalid Credentials", 401);

  const token = generateToken(safeUser);

  await userServices.updateUserByEmail(email, {
    lastLoginAt: new Date(),
  });

  return successResponse(
    res,
    { token: token, user: toUserResponseDtoMinimal(user) },
    200,
  );
};
