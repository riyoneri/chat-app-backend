import { NextFunction, Request, Response } from "express";
import { JwtPayload, verify } from "jsonwebtoken";
import { isValidObjectId } from "mongoose";
import userModel from "../models/user.model";
import CustomError from "../util/custom-error";

interface ExtendedPayload extends JwtPayload {
  id: string;
}

export const isAuth = async (
  request: Request,
  _: Response,
  next: NextFunction,
) => {
  try {
    const header = request.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      const error = new CustomError(
        "Authentication header is missing or does not contain a bearer token",
        401,
      );

      return next(error);
    }

    const token = header.slice("Bearer ".length);

    if (token.length === 0) {
      const error = new CustomError("Bearer token is empty", 401);
      return next(error);
    }

    let { id } = verify(token, process.env.SECRET_KEY!) as ExtendedPayload;

    if (!id || !isValidObjectId(id)) {
      const error = new CustomError("Invalid JWT payload", 401);
      return next(error);
    }

    const user = await userModel.findById(id);

    if (!user) {
      const error = new CustomError("Invalid JWT payload", 401);
      return next(error);
    }

    request.user = user;
    next();
  } catch (error) {
    return next(
      new CustomError(`Invalid JWT: ${(error as Error).message}`, 401),
    );
  }
};
