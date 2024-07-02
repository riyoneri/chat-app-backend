import { Router } from "express";
import { body } from "express-validator";

import * as chatController from "../controllers/chat.controller";

const router = Router();

router.post(
  "/create",
  body("userId", "Enter valid user id")
    .isString()
    .notEmpty({ ignore_whitespace: true })
    .isMongoId()
    .bail()
    .custom((value, { req }) => req.user.id !== value)
    .withMessage("You can not create chat with yourself"),
  chatController.createChat,
);

export default router;
