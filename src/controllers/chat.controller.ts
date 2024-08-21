import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";
import sharp from "sharp";

import getClient from "../helpers/s3client";
import customValidationResult from "../helpers/validation-results";
import Chat from "../models/chat.model";
import Message, { FileType } from "../models/message.model";
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

export const createMessage = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  let imageUploadInfo = {
    isUploaded: false,
    key: "",
  };

  let videoUploadInfo = {
    isUploaded: false,
    key: "",
  };

  try {
    const messagefiles = [];

    const validationResults = customValidationResult(request);
    if (validationResults) {
      const error = new CustomError("Validation error", 400, validationResults);

      return next(error);
    }

    if (request.body.image) {
      const resizedImage = await sharp(request.body.image)
        .resize(1000, undefined, { fit: "contain" })
        .toBuffer();

      const { Key } = await new Upload({
        client: getClient(),
        params: {
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: `ySQm/${nanoid(10)}.webp`,
          Body: resizedImage,
        },
      }).done();

      imageUploadInfo = {
        isUploaded: true,
        key: Key ?? "",
      };
      messagefiles.push({ name: imageUploadInfo.key, type: FileType.IMAGE });
    }

    if (request.body.video) {
      const { Key } = await new Upload({
        client: getClient(),
        params: {
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: `8EQl/${nanoid(10)}.mp4`,
          Body: request.body.video,
        },
      }).done();

      videoUploadInfo = {
        isUploaded: true,
        key: Key ?? "",
      };
      messagefiles.push({ name: Key, type: FileType.VIDEO });
    }

    const messageData = new Message({
      chatId: request.params.chatId,
      files: messagefiles,
      senderId: request.user,
      text: request.body.text,
    });

    await messageData.save();

    response.status(200).json({ message: "Lion" });
  } catch {
    imageUploadInfo.isUploaded &&
      getClient().send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: imageUploadInfo.key,
        }),
      );

    videoUploadInfo.isUploaded &&
      getClient().send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: videoUploadInfo.key,
        }),
      );

    const error = new CustomError("Internal server error.", 500);
    next(error);
  }
};
