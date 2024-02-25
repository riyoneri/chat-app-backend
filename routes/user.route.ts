import express from "express";
import { body } from "express-validator";
import * as userController from "../controllers/user-controller";
import database from "../data/db";

const router = express.Router();

router.post(
  "/",
  [
    body("username", "Username is required")
      .trim()
      .notEmpty({
        ignore_whitespace: true,
      })
      .bail()
      .custom((value) => {
        const user = database.users.find(
          (user) => user.username.toLowerCase() === value?.toLowerCase()
        );

        if (user) throw new Error("Username is already taken");

        return true;
      }),
    body("emoji", "Emoji is required")
      .trim()
      .notEmpty({ ignore_whitespace: true }),
  ],
  userController.postCreateUser
);

export default router;
