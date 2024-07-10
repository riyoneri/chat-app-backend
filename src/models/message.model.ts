import { Schema, Types, model } from "mongoose";

enum FileType {
  IMAGE = "image",
  VIDEO = "video",
  FILE = "file",
}

enum MessageState {
  PENDING = "pending",
  DELIVERED = "delivered",
  SEEN = "seen",
}

interface IMessage {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  text?: string;
  state: MessageState;
  files?: { name: string; type: FileType }[];
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    state: { type: String, required: true, enum: MessageState },
    text: String,
    files: [{ name: String, enum: FileType, type: String }],
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

export default model<IMessage>("Message", messageSchema);
