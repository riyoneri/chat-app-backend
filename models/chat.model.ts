import { Document, Schema, model } from "mongoose";

export interface IChatModel extends Document {
  participants: [Schema.Types.ObjectId, Schema.Types.ObjectId];
}

const chatSchema = new Schema(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      required: true,
    },
  },
  { versionKey: false, timestamps: true },
);

export default model<IChatModel>("Chat", chatSchema);
