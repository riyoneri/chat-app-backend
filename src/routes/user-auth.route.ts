import { Router } from "express";
import { body } from "express-validator";

import * as userAuthController from "../controllers/user-auth.controller";
import busboyMiddleware from "../middlewares/busboy.middleware";
import User from "../models/user.model";

const router = Router();

router.post(
  "/register",
  busboyMiddleware,
  [
    body("name", "Name is required")
      .isString()
      .withMessage("Name must be a string")
      .trim()
      .notEmpty({ ignore_whitespace: true }),
    body("username", "Username is required")
      .isString()
      .withMessage("Username must be a string")
      .trim()
      .notEmpty({ ignore_whitespace: true })
      .bail()
      .custom((value) =>
        User.findOne({ username: value.toLowerCase() }).then((user) => {
          if (user) throw "Username already exists";
        }),
      ),
    body("email", "Email is required")
      .isString()
      .withMessage("Email must be a string")
      .trim()
      .notEmpty({ ignore_whitespace: true })
      .isEmail()
      .withMessage("Email is invalid")
      .toLowerCase()
      .custom((value) =>
        User.findOne({ email: value }).then((user) => {
          if (user) throw "Email already exists";
        }),
      ),
    body("image", "Image is required")
      .notEmpty({ ignore_whitespace: true })
      .custom((_, { req }) => {
        if (req.body.fileErrors) throw req.body.fileErrors;
        return true;
      }),
    body("password", "Password is not strong")
      .isString()
      .withMessage("Password must be a string")
      .notEmpty({ ignore_whitespace: true })
      .withMessage("Password is required")
      .matches(/\d/)
      .matches(/[A-Z]/)
      .matches(/[a-z]/)
      .matches(/\W/)
      .isLength({ min: 8 }),
    body("confirmPassword", "Confirm password is required")
      .isString()
      .withMessage("Confirm-password must be a string")
      .notEmpty({ ignore_whitespace: true })
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords must match"),
  ],
  userAuthController.register,
);

export default router;
