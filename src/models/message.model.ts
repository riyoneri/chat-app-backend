import { Schema, Types, model } from "mongoose";

enum FileType {
  IMAGE = "image",
  VIDEO = "video",
  VOICE_NOTE = "voice-note",
}

enum MessageState {
  PENDING = "pending",
  DELIVERED = "delivered",
  SEEN = "seen",
}

interface IMessage {
  chatId: Types.ObjectId;
  senderId: Types.ObjectId;
  text?: string;
  state: MessageState;
  files?: { name: string; type: FileType }[];
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    state: {
      type: String,
      required: true,
      enum: MessageState,
      default: MessageState.DELIVERED,
    },
    text: String,
    files: [{ name: String, enum: FileType, type: String, _id: false }],
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
