import { Router } from "express";
import { body, param } from "express-validator";

import * as chatController from "../controllers/chat.controller";

const router = Router();

router
  .post(
    "/",
    body("userId", "Enter valid user id")
      .isString()
      .notEmpty({ ignore_whitespace: true })
      .isMongoId()
      .bail()
      .custom((value, { req }) => req.user.id !== value)
      .withMessage("You can not create chat with yourself"),
    chatController.createChat,
  )
  .get("/", chatController.getAllChats)
  .get(
    "/:chatId",
    [
      param("chatId", "Id in params is invalid")
        .isString()
        .notEmpty({ ignore_whitespace: true })
        .isMongoId(),
    ],
    chatController.getSingleChat,
  );

export default router;
