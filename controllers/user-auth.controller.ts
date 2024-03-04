import { hashSync } from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import userModel from "../models/user.model";
import CustomError from "../util/custom-error";
import { deletefile } from "../util/file-system";
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
        422,
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
      transform(document, returnValue) {
        delete returnValue._id;
        delete returnValue.createdAt;
        delete returnValue.updatedAt;
        delete returnValue.password;
        return {
          _id: document._id,
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
