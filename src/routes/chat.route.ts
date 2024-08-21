import { Router } from "express";
import { body, param } from "express-validator";

import * as chatController from "../controllers/chat.controller";
import chatIdValidatorMiddleware from "../middlewares/chat-id-validator.middleware";
import createMessageMiddleware from "../middlewares/create-message.middleware";

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
  )
  .post(
    "/message/:chatId",
    param("chatId").notEmpty({ ignore_whitespace: true }).isMongoId().trim(),
    chatIdValidatorMiddleware,
    createMessageMiddleware,
    [
      body("text", "Message is required").optional({ values: "undefined" }),
      body("image").custom((_, { req }) => {
        if (req.body.imageError) throw req.body.imageError;
        return true;
      }),
      body("video").custom((_, { req }) => {
        if (req.body.videoError) throw req.body.videoError;
        return true;
      }),
      body("voice_note").custom((_, { req }) => {
        if (req.body.voiceNoteError) throw req.body.voiceNoteError;
        return true;
      }),
    ],
    chatController.createMessage,
  );

export default router;
