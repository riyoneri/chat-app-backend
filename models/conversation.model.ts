/* eslint-disable no-unused-vars */
import { Document, Schema, model } from "mongoose";

export enum CONVERSATION_CATEGORIES {
  GROUP = "GROUP",
  DIRECT = "DIRECT",
}

export interface IConversationModel extends Document {
  category: CONVERSATION_CATEGORIES;
  participants: Schema.Types.ObjectId[];
  lastMessage: {
    text: string;
    sender: Schema.Types.ObjectId;
    sendTime: Date;
  };
}

const conversationSchema = new Schema(
  {
    category: {
      type: String,
      enum: CONVERSATION_CATEGORIES,
    },
    participants: {
      type: [Schema.Types.ObjectId],
      ref: "User",
    },
    lastMessage: {
      type: {
        text: { type: String, required: true },
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        sendTime: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
      required: true,
      _id: false,
    },
    createdAt: {
      type: Date,
      select: false,
    },
    updatedAt: {
      type: Date,
      select: false,
    },
  },
  { versionKey: false, timestamps: true },
);

export default model<IConversationModel>("Conversation", conversationSchema);
