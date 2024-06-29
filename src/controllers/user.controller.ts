import { NextFunction, Response } from "express";
import { Request } from "express-jwt";

import User from "../models/user.model";
import CustomError from "../utils/custom-error";

export const getAllUsers = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const newChatUsers = await User.find({
      $and: [
        { _id: { $ne: request.user?.id } },
        { _id: { $nin: request.user?.chatUsers } },
      ],
    })
      .sort({ _id: -1 })
      .transform((documents) =>
        documents.map((singleDocument) => singleDocument.toJSON()),
      );

    response.status(200).json(newChatUsers);
  } catch {
    const error = new CustomError("Internal server error.", 500);
    next(error);
  }
};
