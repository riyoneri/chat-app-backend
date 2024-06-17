import { Schema, model } from "mongoose";

export interface IUserModel extends Document {
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  chatUsers: [string, string];
  password: string;
  createdAt: Date;
}

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, requied: true, unique: true },
    imageUrl: {},
    chatUsers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
    },
    password: { type: String, required: true },
    createdAt: {
      type: Date,
      select: false,
    },
  },
  {
    versionKey: false,
    timestamps: {
      createdAt: true,
    },
    toJSON: {
      transform: (document, returnValue) => {
        delete returnValue.password;
        delete returnValue._id;
        return { id: document._id.toString(), ...returnValue };
      },
    },
  },
);

export default model<IUserModel>("User", userSchema);
