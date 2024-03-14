import Busboy from "busboy";
import express, { NextFunction, Request, Response } from "express";
import { body } from "express-validator";
import { createWriteStream } from "node:fs";
import { extname, join } from "node:path";
import * as userAuthcontroller from "../controllers/user-auth.controller";
import { ensureDirectory } from "../util/file-system";
import { getFileId } from "../util/generate-id";
import User from "../models/user.model";
import CustomError from "../util/custom-error";

const router = express.Router();

const requestBusboy = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  if (!request.get("Content-Type")?.includes("multipart")) {
    const error = new CustomError("Invalid data received", 400);
    return next(error);
  }

  const busboy = Busboy({
    headers: request.headers,
    limits: { fileSize: 1024 * 1024 * 2, files: 1 },
  });

  const imageStoragePath = join(process.cwd(), "public", "uploads", "users");
  ensureDirectory(imageStoragePath);
  request.body.fileErrors = {};

  busboy
    .on("file", (name, file, { filename, mimeType }) => {
      if (name !== "image") {
        file.resume();
        return;
      }

      if (!["image/jpeg", "image/png", "image/jpg"].includes(mimeType)) {
        request.body.fileErrors[name] = "The file must be an image";

        file.resume();
        return;
      }

      const storageName = `user_${getFileId()}${extname(filename)}`;

      const saveTo = join(imageStoragePath, storageName);

      const writeStream = file.pipe(createWriteStream(saveTo));

      request.body.image = saveTo;

      file.on("limit", () => {
        file.unpipe(writeStream);
        writeStream.end();

        request.body.fileErrors[name] =
          "File is too large. Maximum size is 2MBS";

        file.resume();
      });
    })
    .on("filesLimit", () => {
      request.body.fileErrors["image"] = "Too many files. Maximum is 1";
    })
    .on("field", (name, value) => {
      request.body[name] = value;
    })
    .on("error", () => {
      request.body.fileErrors["image"] =
        "Something went wrong while uploading file, try again";
      next();
    })
    .on("close", () => next());

  request.pipe(busboy);
};

router
  .post(
    "/register",
    requestBusboy,
    [
      body("name", "Name is required")
        .trim()
        .notEmpty({ ignore_whitespace: true }),
      body("email", "E-mail address is required")
        .trim()
        .notEmpty({ ignore_whitespace: true })
        .isEmail()
        .withMessage("E-mail address is invalid")
        .bail()
        .toLowerCase()
        .custom((value) =>
          User.findOne({ email: value }).then((user) => {
            if (user) throw "E-mail address already exists";
          }),
        ),
      body("username", "Username is required")
        .trim()
        .notEmpty({ ignore_whitespace: true })
        .bail()
        .toLowerCase()
        .custom((value) =>
          User.findOne({ username: value }).then((user) => {
            if (user) throw "Username already exists";
          }),
        ),
      body("image", "Image is required")
        .notEmpty({ ignore_whitespace: true })
        .custom((_value, { req }) => {
          if (req.body.fileErrors?.image) throw req.body.fileErrors?.image;
          return true;
        }),
      body("password", "Password is required")
        .notEmpty({ ignore_whitespace: true })
        .bail()
        .matches(/\d/)
        .withMessage("Password must contain atleast one number")
        .matches(/[A-Z]/)
        .withMessage("Password must contain uppercase character")
        .matches(/[a-z]/)
        .withMessage("Password must contain lowercase character")
        .matches(/\W/)
        .withMessage("Password must contain special character")
        .isLength({ min: 8 })
        .withMessage("Password must be 8+ characters"),
      body("confirmPassword", "Confirm password is required")
        .notEmpty({ ignore_whitespace: true })
        .custom((value, { req }) => value === req.body.password)
        .withMessage("Password must match"),
    ],
    userAuthcontroller.postRegister,
  )
  .post(
    "/",
    [
      body("emailOrUsername", "Email or username is required")
        .notEmpty({ ignore_whitespace: true })
        .trim()
        .bail()
        .toLowerCase(),
      body("password", "Password is required")
        .notEmpty({ ignore_whitespace: true })
        .bail(),
    ],
    userAuthcontroller.postLogin,
  );

export default router;
