import express from "express";
import {
  createMessage,
  deleteMessageByMessageId,
  getAllMessages,
  getMessageById,
} from "../controllers/messageController";
import { validateMessageMiddleware } from "../middleware/messageMiddleware";
import { catchAsync } from "../utils/catchAsync";
import { loggerFunction, messageLogger } from "../utils/loggers";

const messageRouter = express.Router();

messageRouter
  .route("/")
  .get(catchAsync(getAllMessages))
  .post(validateMessageMiddleware, catchAsync(createMessage));

messageRouter.param("id", loggerFunction(messageLogger));

messageRouter
  .route("/:id")
  .get(catchAsync(getMessageById))
  .delete(catchAsync(deleteMessageByMessageId));

export default messageRouter;
