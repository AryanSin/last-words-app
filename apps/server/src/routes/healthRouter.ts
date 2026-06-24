import express, { NextFunction, Request, Response } from "express";

const healthRouter = express.Router();

healthRouter
  .route("/")
  .get((req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
    });
  });

export default healthRouter;
