import { compareSync, hashSync } from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { sign } from "jsonwebtoken";
import userModel from "../models/user.model";
import CustomError from "../util/custom-error";
import { sendImgurRequest } from "../util/imgur-request";
import { serializeValidation } from "../util/validation";

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

      return next(error);
    }

    const { link } = await sendImgurRequest(request.body.image);

    const hashedPassword = hashSync(request.body.password, 12);

    const userData = new userModel({
      name: request.body.name,
      email: request.body.email,
      username: request.body.username,
      imageUrl: link,
      password: hashedPassword,
    });

    const savedUser = await userData.save();

    const transformedUser = savedUser.toJSON({
      transform(_document, returnValue) {
        delete returnValue.password;
        delete returnValue.chatUsers;
        return {
          ...returnValue,
        };
      },
    });

    response.status(201).json(transformedUser);
  } catch {
    const error = new CustomError("Internal server error");
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
        };
      },
    });

    response.status(200).json({ user: transformedUser, token });
  } catch {
    const error = new CustomError("Internal server error");
    next(error);
  }
};
