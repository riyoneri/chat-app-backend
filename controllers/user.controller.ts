import { NextFunction, Request, Response } from "express";
import userModel from "../models/user.model";
import CustomError from "../util/custom-error";

const USERS_PER_PAGE = 1;

export const getUsers = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const currentPage = Number(request.query.page) || 1;
    const totalUsers = await userModel.countDocuments();

    const users = await userModel
      .find()
      .sort({ _id: -1 })
      .skip((currentPage - 1) * USERS_PER_PAGE)
      .limit(USERS_PER_PAGE)
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

    response.json({
      users,
      hasNextPage: USERS_PER_PAGE * currentPage < totalUsers,
    });
  } catch {
    const error = new CustomError("Internal server error");
    next(error);
  }
};
