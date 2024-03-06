import { NextFunction, Request, Response } from "express";
import userModel from "../models/user.model";
import CustomError from "../util/custom-error";

export const getUsers = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const users = await userModel
      .find()
      .sort({ _id: -1 })
      .transform((documents) =>
        documents.map((singleDocument) =>
          singleDocument.toJSON({
            transform(_document, returnValue) {
              delete returnValue.password;
              return {
                ...returnValue,
                imageUrl: `${request.protocol}://${request.headers.host}/${returnValue.imageUrl}`,
              };
            },
          }),
        ),
      );

    response.json(users);
  } catch {
    const error = new CustomError("Internal server error");
    next(error);
  }
};
