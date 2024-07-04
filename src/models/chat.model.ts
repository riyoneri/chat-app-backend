import { Request } from "express";
import { Document, Schema, model } from "mongoose";

export interface IChatModel extends Document {
  participants: {
    first: Schema.Types.ObjectId;
    last: Schema.Types.ObjectId;
  };
  lastMessage: {
    text: string;
    sender: Schema.Types.ObjectId;
  };
  toCustomObject: (request: Request) => void;
}

const chatSchema = new Schema<IChatModel>(
  {
    participants: {
      type: {
        first: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "User",
        },
        last: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "User",
        },
      },
      _id: false,
      required: true,
    },
    lastMessage: {
      type: {
        text: { type: String, required: true },
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
      required: true,
      _id: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
    toJSON: {
      transform: (document, returnValue) => {
        delete returnValue._id;
        const { id } = returnValue.lastMessage.sender;

        return {
          id: document.id,
          ...returnValue,
          lastMessage: {
            ...returnValue.lastMessage,
            sender: id,
          },
        };
      },
    },
  },
);

chatSchema.methods.toCustomObject = function (request: Request) {
  const chat = this.toJSON();
  const participant =
    request.user?.id === chat.participants.first.id
      ? chat.participants.last
      : chat.participants.first;

  delete chat.participants;

  return { ...chat, participant };
};

export default model<IChatModel>("Chat", chatSchema);
