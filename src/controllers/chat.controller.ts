import { NextFunction, Request, Response } from "express";

import customValidationResult from "../helpers/validation-results";
import Chat from "../models/chat.model";
import User from "../models/user.model";
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

    // if (request.user?.chatUsers.includes(newChatUser.id)) {}

    request.user?.chatUsers.push(newChatUser.id);
    newChatUser.chatUsers.push(request.user?.id);

    // await request.user?.save();
    // await newChatUser.save();

    const newChat = new Chat({
      participants: { first: request.user, last: newChatUser },
      lastMessage: { text: "New chat", sender: request.user },
    });

    const savedChat = await newChat.save();

    const populatedChat = await savedChat.populate(
      "participants.first participants.last",
      "name username email.value imageUrl",
    );

    const refactoredChat = populatedChat.toJSON({
      transform(document, returnValue) {
        if (!returnValue.participants) return returnValue;
        delete returnValue._id;

        const participant =
          returnValue.participants.first?.id === request.user?.id
            ? returnValue.participants.last.toJSON()
            : returnValue.participants.first.toJSON();

        delete returnValue.participants;

        return {
          id: document.id,
          ...returnValue,
          participant,
        };
      },
    });

    response.status(200).json(refactoredChat);
  } catch {
    const error = new CustomError("Internal server error.", 500);
    next(error);
  }
};
