import { Schema, model } from "mongoose";

export interface IUserModel extends Document {
  name: string;
  username: string;
  email: {
    value: string;
    verified: boolean;
  };
  imageUrl: string;
  chatUsers: [string, string];
  password: string;
  createdAt: Date;
}

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true },
    email: {
      value: { type: String, required: true },
      verified: { type: String, required: true, default: false },
    },
    imageUrl: {},
    chatUsers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
    },
    password: { type: String, required: true },
  },
  {
    versionKey: false,
    timestamps: {
      updatedAt: false,
    },
    toJSON: {
      transform: (document, returnValue) => {
        delete returnValue.password;
        delete returnValue._id;
        return {
          id: document._id.toString(),
          ...returnValue,
          email: returnValue.email.value,
          imageUrl: `${process.env.AWS_DISTRIBUTION_DOMAIN_NAME}/${returnValue.imageUrl}`,
        };
      },
    },
  },
);

export default model<IUserModel>("User", userSchema);
