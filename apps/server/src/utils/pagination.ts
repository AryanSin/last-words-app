import { Request } from "express";

export interface PaginationOptions {
  take: number;
  skip: number;
  page: number;
  limit: number;
}

export const getPagination = (
  req: Request,
  defaultLimit = 10,
  maxLimit = 100,
): PaginationOptions => {
  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10) || 1);
  const rawLimit =
    parseInt(
      (req.query.limit as string) || (req.query.size as string) || String(defaultLimit),
      10,
    ) || defaultLimit;
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  const skip = (page - 1) * limit;

  return { take: limit, skip, page, limit };
};
