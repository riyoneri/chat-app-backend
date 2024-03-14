import { hashSync, compareSync } from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import userModel from "../models/user.model";
import CustomError from "../util/custom-error";
import { deletefile } from "../util/file-system";
import { serializeValidation } from "../util/validation";
import { sign } from "jsonwebtoken";

export const postRegister = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(request);

    if (!errors.isEmpty()) {
      const error = new CustomError(
        "Validation failed",
        400,
        serializeValidation(errors),
      );

      request.body.image && deletefile(request.body.image);

      return next(error);
    }

    const hashedPassword = hashSync(request.body.password, 12);

    const userData = new userModel({
      name: request.body.name,
      email: request.body.email,
      username: request.body.username,
      imageUrl: request.body.image.split(/public\W+/)[1],
      password: hashedPassword,
    });

    const savedUser = await userData.save();

    const transformedUser = savedUser.toJSON({
      transform(_document, returnValue) {
        delete returnValue.password;
        delete returnValue.chatUsers;
        return {
          ...returnValue,
          imageUrl: `${request.protocol}://${request.headers.host}/${returnValue.imageUrl}`,
        };
      },
    });

    response.status(201).json(transformedUser);
  } catch {
    const error = new CustomError("Internal server error");
    request.body.image && deletefile(request.body.image);
    next(error);
  }
};

export const postLogin = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(request);

    if (!errors.isEmpty()) {
      const error = new CustomError(
        "Incorrect E-mail address or password",
        400,
        serializeValidation(errors),
      );

      return next(error);
    }

    const user = await userModel.findOne({
      $or: [
        { email: request.body.emailOrUsername },
        { username: request.body.emailOrUsername },
      ],
    });

    if (!user) {
      const error = new CustomError(
        "Incorrect E-mail address or password",
        400,
      );

      return next(error);
    }

    const passwordMatch = compareSync(request.body.password, user.password);

    if (!passwordMatch) {
      const error = new CustomError(
        "Incorrect E-mail address or password",
        400,
      );

      return next(error);
    }

    const token = sign({ id: user._id }, process.env.SECRET_KEY!, {
      expiresIn: "1h",
      noTimestamp: true,
    });

    const transformedUser = user.toJSON({
      transform(document, returnValue) {
        delete returnValue.password;
        delete returnValue._id;
        delete returnValue.chatUsers;

        return {
          _id: document._id,
          ...returnValue,
          imageUrl: `${process.env.NODE_ENV === "production" ? "https" : request.protocol}://${request.headers.host}/${returnValue.imageUrl}`,
        };
      },
    });

    response.status(200).json({ user: transformedUser, token });
  } catch {
    const error = new CustomError("Internal server error");
    next(error);
  }
};
