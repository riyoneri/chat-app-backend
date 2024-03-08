import { Document, Schema, model } from "mongoose";

export interface IUserModel extends Document {
  name: string;
  email: string;
  username: string;
  imageUrl: string;
  chatUsers: string[];
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: true },
    chatUsers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
    },
    password: { type: String, required: true },
    createdAt: {
      type: Date,
      select: false,
    },
    updatedAt: {
      type: Date,
      select: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
);

export default model<IUserModel>("User", userSchema);
