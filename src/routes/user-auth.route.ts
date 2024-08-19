import { Router } from "express";
import { body } from "express-validator";

import * as userAuthController from "../controllers/user-auth.controller";
import registerBusboyMiddleware from "../middlewares/register-busboy.middleware";
import User from "../models/user.model";

const router = Router();

router
  .post(
    "/register",
    registerBusboyMiddleware,
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
        .bail()
        .custom((value) =>
          User.findOne({ "email.value": value }).then((user) => {
            if (user) throw "Email already exists";
          }),
        ),
      body("image", "Image is required")
        .notEmpty({ ignore_whitespace: true })
        .custom((_, { req }) => {
          if (req.body.fileError) throw req.body.fileError;
          return true;
        }),
      body("password", "Password is not strong")
        .isString()
        .withMessage("Password must be a string")
        .notEmpty({ ignore_whitespace: true })
        .withMessage("Password is required")
        .bail()
        .matches(/\d/)
        .matches(/[A-Z]/)
        .matches(/[a-z]/)
        .matches(/\W/)
        .isLength({ min: 8 }),
      body("confirmPassword", "Confirm password is required")
        .isString()
        .withMessage("Confirm-password must be a string")
        .notEmpty({ ignore_whitespace: true })
        .bail()
        .custom((value, { req }) => value === req.body.password)
        .withMessage("Passwords must match"),
      body("redirectUrl", "Redirect URL is required")
        .isString()
        .withMessage("Redirect URL must be a string")
        .notEmpty({ ignore_whitespace: true }),
    ],
    userAuthController.register,
  )
  .post(
    "/resend-verification",
    [
      body("email", "Email is required")
        .isString()
        .withMessage("Email must be a string")
        .trim()
        .notEmpty({ ignore_whitespace: true })
        .isEmail()
        .withMessage("Email is invalid")
        .toLowerCase(),
      body("redirectUrl", "Redirect URL is required")
        .isString()
        .withMessage("Redirect URL must be a string")
        .notEmpty({ ignore_whitespace: true }),
    ],
    userAuthController.resendVerificationEmail,
  )
  .post(
    "/verify-email",
    body("token", "Token is required")
      .isString()
      .withMessage("Token must be string")
      .trim()
      .notEmpty({ ignore_whitespace: true }),
    userAuthController.verifyEmail,
  )
  .post(
    "/login",
    [
      body("emailOrUsername", "Email must be a string")
        .isString()
        .trim()
        .notEmpty({ ignore_whitespace: true })
        .toLowerCase(),
      body("password", "Password must be string")
        .isString()
        .trim()
        .notEmpty({ ignore_whitespace: true }),
    ],
    userAuthController.login,
  );

export default router;
