import { Request } from "express";

export const getPagination = (
  req: Request,
): { take: number; skip: number } | undefined => {
  const { page, size } = req.query;
  const pageNum = Number(page);
  const sizeNum = Number(size);

  if (!Number.isNaN(pageNum) && !Number.isNaN(sizeNum)) {
    const take = pageNum;
    const skip = (pageNum - 1) * sizeNum;

    return { take, skip };
  }

  return undefined;
};
