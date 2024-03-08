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
      const conversation = await conversationModel
        .findOne({
          participants: { $all: [newUserChat._id, request.user._id] },
        })
        .populate("participants")
        .transform((document) =>
          document?.toJSON({
            transform(_, returnValue) {
              if (returnValue.participants) {
                returnValue.participants =
                  returnValue.participants[0]._id.toString() ===
                  request.user?._id.toString()
                    ? (returnValue.participants = returnValue.participants[1])
                    : (returnValue.participants = returnValue.participants[0]);

                returnValue.participants.imageUrl = `${request.protocol}://${request.headers.host}/${returnValue.participants.imageUrl}`;

                delete returnValue.participants.password;
              }

              return returnValue;
            },
          }),
        );

      if (!conversation) throw new CustomError("Internal server error");

      return response.status(201).json(conversation);
    }

    request.user?.chatUsers.push(newUserChat._id);
    newUserChat.chatUsers.push(request.user?._id);

    await request.user?.save();
    await newUserChat.save();

    const conversationData = new conversationModel({
      category: CONVERSATION_CATEGORIES.DIRECT,
      participants: [request.user, newUserChat._id],
      lastMessage: {
        text: "Just landed...",
        sender: newUserChat._id,
      },
    });

    const savedConversation = await conversationData.save();

    const populatedConversation =
      await savedConversation.populate("participants");

    const modifiedConversation = populatedConversation.toJSON({
      transform(_document, returnValue) {
        if (returnValue.participants) {
          returnValue.participants =
            returnValue.participants[0]._id.toString() ===
            request.user?._id.toString()
              ? (returnValue.participants = returnValue.participants[1])
              : (returnValue.participants = returnValue.participants[0]);

          returnValue.participants.imageUrl = `${request.protocol}://${request.headers.host}/${returnValue.participants.imageUrl}`;

          delete returnValue.participants.password;
          delete returnValue.participants.chatUsers;
        }

        return returnValue;
      },
    });

    response.status(201).json(modifiedConversation);
  } catch {
    const error = new CustomError("Internal server error");
    next(error);
  }
};

export const getAllchats = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const chats = await conversationModel
      .find({
        $and: [
          { category: CONVERSATION_CATEGORIES.DIRECT },
          {
            participants: { $in: [request.user?._id] },
          },
        ],
      })
      .populate("participants")
      .transform((documents) =>
        documents.map((singleDocument) =>
          singleDocument.toJSON({
            transform(_document, returnValue) {
              if (returnValue.participants) {
                returnValue.participants =
                  returnValue.participants[0]._id.toString() ===
                  request.user?._id.toString()
                    ? (returnValue.participants = returnValue.participants[1])
                    : (returnValue.participants = returnValue.participants[0]);

                returnValue.participants.imageUrl = `${request.protocol}://${request.headers.host}/${returnValue.participants.imageUrl}`;

                delete returnValue.participants.password;
                delete returnValue.participants.chatUsers;
              }

              return returnValue;
            },
          }),
        ),
      );

    response.json(chats);
  } catch {
    const error = new CustomError("Internal server error");
    next(error);
  }
};
