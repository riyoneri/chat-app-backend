import { Request } from "express";
import { Schema, Types, model } from "mongoose";

import { IUserModel } from "./user.model";

export interface IChatModel {
  participants: {
    first: Types.ObjectId;
    last: Types.ObjectId;
  };
  lastMessage: {
    text: string;
    sender: Types.ObjectId;
  };
  toCustomObject: (
    request: Request,
  ) => Omit<IChatModel, "participants"> & { participant: IUserModel };
  unreads: {
    first: { number: number; id: Types.ObjectId };
    last: { number: number; id: Types.ObjectId };
  };
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
    unreads: {
      type: {
        first: {
          type: {
            number: { type: Number, required: true, default: 0 },
            id: { type: Schema.Types.ObjectId, required: true },
          },
          required: true,
          _id: false,
        },
        last: {
          type: {
            number: { type: Number, required: true, default: 0 },
            id: { type: Schema.Types.ObjectId, required: true },
          },
          required: true,
          _id: false,
        },
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

        return {
          id: document.id,
          ...returnValue,
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

  const unread =
    request.user?.id === chat.unreads.first.id.toString()
      ? chat.unreads.first.number
      : chat.unreads.last.id.number;

  delete chat.participants;
  delete chat.unreads;

  return { ...chat, participant, unread };
};

export default model<IChatModel>("Chat", chatSchema);
