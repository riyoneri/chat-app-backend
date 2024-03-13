import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import conversationModel, {
  CONVERSATION_CATEGORIES,
} from "../models/conversation.model";
import messageModel from "../models/message.model";
import userModel from "../models/user.model";
import { findClientSocket, ioConfig } from "../socket";
import CustomError from "../util/custom-error";
import { getRandomNewText } from "../util/new-messages";

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
        text: getRandomNewText(),
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

    const clientSocket = findClientSocket(newUserChat.id);

    if (clientSocket) {
      ioConfig.getIO().to(clientSocket).emit("chats", { type: "refetch" });
    }

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

export const getChatMessages = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(request);

    if (!errors.isEmpty()) {
      const error = new CustomError("Invalid chat id", 400);

      return next(error);
    }

    const conversation = await conversationModel.findOne({
      $and: [
        { _id: request.params.chatId },
        { category: CONVERSATION_CATEGORIES.DIRECT },
        { participants: { $in: [request.user?._id] } },
      ],
    });

    if (!conversation) {
      const error = new CustomError("Chat not found", 404);

      return next(error);
    }

    let extendedConversation = await conversation.populate(
      "participants",
      "name imageUrl username",
    );

    const messages = await messageModel.find({
      conversationId: conversation.id,
    });

    extendedConversation = extendedConversation.toJSON({
      transform(_document, returnValue) {
        if (returnValue.participants) {
          returnValue.participants =
            returnValue.participants[0]._id.toString() ===
            request.user?._id.toString()
              ? (returnValue.participants = returnValue.participants[1])
              : (returnValue.participants = returnValue.participants[0]);

          returnValue.messages = messages;

          returnValue.participants.imageUrl = `${request.protocol}://${request.headers.host}/${returnValue.participants.imageUrl}`;
        }

        return returnValue;
      },
    });

    response.status(200).json(extendedConversation);
  } catch {
    const error = new CustomError("Internal server error");
    next(error);
  }
};

export const postCreateMessage = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(request);

    if (!errors.isEmpty()) {
      const error = new CustomError("Invalid chat id", 400);

      return next(error);
    }

    const conversation = await conversationModel.findOne({
      $and: [
        { _id: request.params.chatId },
        { category: CONVERSATION_CATEGORIES.DIRECT },
        { participants: { $in: [request.user?._id] } },
      ],
    });

    if (!conversation) {
      const error = new CustomError("Chat not found", 404);

      return next(error);
    }

    const messageData = new messageModel({
      conversationId: conversation._id,
      senderId: request.user?._id,
      content: request.body.messageText,
    });

    const savedMessage = await messageData.save();

    conversation.lastMessage = {
      text: request.body.messageText,
      sender: request.user?._id,
      sendTime: new Date(),
    };

    await conversation.save();

    const clientSocket = findClientSocket(
      conversation.participants[0].toString() === request.user?.id
        ? conversation.participants[1].toString()
        : conversation.participants[0].toString(),
    );

    if (clientSocket) {
      ioConfig
        .getIO()
        .to(clientSocket)
        .emit("message", { newMessage: savedMessage, chatId: conversation.id });
    }

    response.json(savedMessage);
  } catch {
    const error = new CustomError("Internal server error");
    next(error);
  }
};
