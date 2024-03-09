import { Document, Schema, model } from "mongoose";

export interface IMessageSchema extends Document {
  conversationId: string;
  senderId: string;
  content: string;
}

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export default model<IMessageSchema>("Message", messageSchema);
