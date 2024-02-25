import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import database, { User } from "../data/db";
import CustomError from "../util/custom-error";
import { getUserId } from "../util/generate-id";
import { serializeValidation } from "../util/validation";

export const postCreateUser = (
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

    const newUser: User = {
      _id: getUserId(),
      username: request.body.username,
      emoji: request.body.emoji,
      createdAt: new Date().toISOString(),
    };

    database.users.push(newUser);

    response.status(201).json(newUser);
  } catch {
    const error = new CustomError("Internal server error", 500);
    next(error);
  }
};
