import { Document, Schema, model } from "mongoose";

export interface IUserModel extends Document {
  name: string;
  username: string;
  email: {
    value: string;
    verified: boolean;
  };
  imageUrl: string;
  chatUsers: Schema.Types.ObjectId[];
  password: string;
  tokens: {
    emailVerification: string;
  };
}

const userSchema = new Schema<IUserModel>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true },
    email: {
      value: { type: String, required: true },
      verified: { type: Boolean, required: true, default: false },
    },
    imageUrl: { type: String, required: true },
    chatUsers: {
      type: [Schema.Types.ObjectId],
      ref: "User",
    },
    password: { type: String, required: true },
    tokens: {
      emailVerification: String,
    },
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
        delete returnValue.tokens;
        return {
          id: document.id,
          ...returnValue,
          email: returnValue.email.value,
          imageUrl: `${process.env.AWS_DISTRIBUTION_DOMAIN_NAME}/${returnValue.imageUrl}`,
        };
      },
    },
  },
);

export default model<IUserModel>("User", userSchema);
