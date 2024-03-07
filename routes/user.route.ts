import express from "express";
import * as userControllers from "../controllers/user.controller";
import { isAuth } from "../middlewares/is-auth";
import { body, query } from "express-validator";

const router = express.Router();

router.get(
  "/users",
  isAuth,
  [query("page").optional({ values: "undefined" }).toInt()],
  userControllers.getUsers,
);

router.post(
  "/chats",
  isAuth,
  [
    body("userId", "Invalid user id")
      .trim()
      .notEmpty({ ignore_whitespace: true })
      .isMongoId(),
  ],
  userControllers.createChat,
);

export default router;
