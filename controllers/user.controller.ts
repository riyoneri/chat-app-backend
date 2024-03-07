import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import conversationModel, {
  CONVERSATION_CATEGORIES,
} from "../models/conversation.model";
import userModel from "../models/user.model";
import CustomError from "../util/custom-error";

const USERS_PER_PAGE = 3;

export const getUsers = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const currentPage = Number(request.query.page) || 1;
    const totalUsers = await userModel.countDocuments();

    const users = await userModel
      .find({
        $and: [
          { _id: { $ne: request.user?._id } },
          { _id: { $nin: request.user?.chatUsers } },
        ],
      })
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
      hasNextPage: USERS_PER_PAGE * currentPage < totalUsers - 1,
    });
  } catch {
    const error = new CustomError("Internal server error");
    next(error);
  }
};

export const createChat = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(request);

    if (!errors.isEmpty()) {
      const error = new CustomError("Invalid user id submitted", 400);

      return next(error);
    }

    const newUserChat = await userModel.findById(request.body.userId);

    if (!newUserChat) {
      const error = new CustomError("User not found", 404);

      return next(error);
    }

    if (request.user?.chatUsers.includes(newUserChat._id)) {
      const conversation = await conversationModel.findOne({
        participants: {
          $and: [{ $in: [newUserChat._id] }, { $in: [request.user._id] }],
        },
      });

      if (!conversation) throw new CustomError("Internal server error");

      return response.status(201).json(conversation);
    }

    const conversationData = new conversationModel({
      category: CONVERSATION_CATEGORIES.DIRECT,
      participants: [request.user, newUserChat._id],
      lastMessage: {
        text: "Just landed...",
        sender: newUserChat._id,
      },
    });

    console.log(conversationData);

    response.status(400).json({ message: "lion" });
  } catch {
    const error = new CustomError("Internal server error");
    next(error);
  }
};
