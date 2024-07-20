import { NextFunction, Request, Response } from "express";

import customValidationResult from "../helpers/validation-results";
import Chat from "../models/chat.model";
import Message from "../models/message.model";
import User from "../models/user.model";
import { clients, getSocketClient, socketConfig } from "../socket";
import CustomError from "../utils/custom-error";

export const createChat = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const validationResults = customValidationResult(request);
    if (validationResults) {
      const error = new CustomError("Validation error", 400, validationResults);

      return next(error);
    }

    const newChatUser = await User.findById(request.body.userId);

    if (!newChatUser) {
      const error = new CustomError("User not found", 404);

      return next(error);
    }

    if (request.user?.chatUsers.includes(newChatUser.id)) {
      const error = new CustomError("A chat with user is already created", 400);

      return next(error);
    }

    request.user?.chatUsers.push(newChatUser.id);
    newChatUser.chatUsers.push(request.user?.id);

    await request.user?.save();
    await newChatUser.save();

    const newChat = new Chat({
      participants: { first: request.user, last: newChatUser },
      unreads: { first: { id: request.user }, last: { id: newChatUser } },
      lastMessage: { text: "New chat", sender: request.user },
    });

    const savedChat = await newChat.save();

    const customChatObject = savedChat.toCustomObject(request);

    const newchatUserSocket = getSocketClient(customChatObject.participant.id);

    if (newchatUserSocket) {
      const socket = socketConfig.getSocket();

      socket.to(newchatUserSocket).emit("chat:create", () => {
        socket.to(newchatUserSocket).emit("chat:active", clients);
      });
    }

    response.status(200).json(customChatObject);
  } catch {
    const error = new CustomError("Internal server error.", 500);
    next(error);
  }
};

export const getAllChats = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const socket = socketConfig.getSocket();
    const chats = await Chat.find({
      $or: [
        { "participants.first": request.user },
        { "participants.last": request.user },
      ],
    })
      .populate("participants.first participants.last")
      .transform((documents) =>
        documents.map((singleDocument) =>
          singleDocument.toCustomObject(request),
        ),
      );

    socket.emit("chat:active", clients);

    response.json(chats);
  } catch {
    const error = new CustomError("Internal server error.", 500);
    next(error);
  }
};

export const getSingleChat = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const validationResults = customValidationResult(request);
    if (validationResults) {
      const error = new CustomError("Validation error", 400, validationResults);

      return next(error);
    }

    const chat = await Chat.findOne({
      $and: [
        { _id: request.params.chatId },
        {
          $or: [
            { "participants.first": request.user },
            { "participants.last": request.user },
          ],
        },
      ],
    }).populate("participants.first participants.last");

    if (!chat) {
      const error = new CustomError("Chat not found", 404);

      return next(error);
    }

    const chatMessages = await Message.find()
      .sort("-1")
      .transform((documents) =>
        documents.map((singleDocument) => singleDocument.toJSON()),
      );

    response
      .status(200)
      .json({ chat: chat.toCustomObject(request), messages: chatMessages });
  } catch {
    const error = new CustomError("Internal server error.", 500);
    next(error);
  }
};
