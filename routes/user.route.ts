import express from "express";
import { body, param, query } from "express-validator";
import * as userControllers from "../controllers/user.controller";
import { isAuth } from "../middlewares/is-auth";

const router = express.Router();

router.get(
  "/users",
  isAuth,
  [query("page").optional({ values: "undefined" }).toInt()],
  userControllers.getUsers,
);

router
  .post(
    "/chats",
    isAuth,
    [
      body("userId", "Invalid user id")
        .trim()
        .notEmpty({ ignore_whitespace: true })
        .isMongoId(),
    ],
    userControllers.createChat,
  )
  .get("/chats", isAuth, userControllers.getAllchats)
  .get(
    "/chats/:chatId",
    isAuth,
    [
      param("chatId")
        .trim()
        .notEmpty({ ignore_whitespace: true })
        .bail()
        .isMongoId(),
    ],
    userControllers.getChatMessages,
  );

export default router;
