import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { compareSync, hashSync } from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { sign } from "jsonwebtoken";
import { nanoid } from "nanoid";
import sharp from "sharp";

import { sendVerificationEmail } from "../helpers/email-senders";
import getClient from "../helpers/s3client";
import customValidationResult from "../helpers/validation-results";
import User from "../models/user.model";
import CustomError from "../utils/custom-error";

export const register = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  let fileUploadInfo = {
    isUploaded: false,
    key: "",
  };

  try {
    const validationResults = customValidationResult(request);
    if (validationResults) {
      const error = new CustomError("Validation error", 400, validationResults);

      return next(error);
    }

    const resizedImage = await sharp(request.body.image)
      .resize(1000, undefined, { fit: "cover" })
      .toBuffer();

    const { Key } = await new Upload({
      client: getClient(),
      params: {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: `Xt8l/${nanoid(10)}.webp`,
        Body: resizedImage,
      },
    }).done();

    fileUploadInfo = {
      isUploaded: true,
      key: Key ?? "",
    };

    const hashedPassword = hashSync(request.body.password, 10);

    const emailToken = nanoid();
    const newUser = new User({
      ...request.body,
      email: {
        value: request.body.email,
        verified: false,
      },
      "email.value": request.body.email,
      password: hashedPassword,
      imageUrl: Key,
      "tokens.emailVerification": emailToken,
    });

    const savedUser = await newUser.save();

    await sendVerificationEmail(
      `${request.body.redirectUrl}?token=${emailToken}`,
      savedUser.name.split(" ")?.[0],
      savedUser.email.value,
    );

    response.status(201).json(savedUser.toJSON());
  } catch {
    fileUploadInfo.isUploaded &&
      getClient()
        .send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileUploadInfo.key,
          }),
        )
        .then(() => {})
        .catch(() => {});

    const error = new CustomError("Internal server error.", 500);
    next(error);
  }
};

export const resendVerificationEmail = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const validationResults = customValidationResult(request);
    if (validationResults) {
      const error = new CustomError("Validation error", 400, validationResults);

      return next(error);
    }

    const user = await User.findOne({
      "email.value": request.body.email,
    });

    if (!user) {
      const error = new CustomError("User not found", 404);

      return next(error);
    }

    if (user.email.verified) {
      const error = new CustomError("Email is already verified", 400);

      return next(error);
    }

    const emailToken = nanoid();

    user.tokens.emailVerification = emailToken;

    await user.save();

    await sendVerificationEmail(
      `${request.body.redirectUrl}?token=${emailToken}`,
      user.name.split(" ")?.[0],
      user.email.value,
    );

    response.status(201).json({ message: "Email verification is resent" });
  } catch {
    const error = new CustomError("Internal server error.", 500);
    next(error);
  }
};

export const verifyEmail = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const validationResults = customValidationResult(request);
    if (validationResults) {
      const error = new CustomError("Validation error", 400, validationResults);

      return next(error);
    }

    const user = await User.findOne({
      "tokens.emailVerification": request.body.token,
    });

    if (!user || user.email.verified) {
      const error = new CustomError("User not found", 404);

      return next(error);
    }

    user.email.verified = true;
    user.tokens.emailVerification = "";

    await user.save();

    response.status(200).json({ message: "User email is verified" });
  } catch {
    const error = new CustomError("Internal server error.", 500);
    next(error);
  }
};

export const login = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    const validationResults = customValidationResult(request);
    if (validationResults) {
      const error = new CustomError("Validation error", 400, validationResults);

      return next(error);
    }

    const user = await User.findOne({
      $or: [
        { "email.value": request.body.emailOrUsername },
        { username: request.body.emailOrUsername },
      ],
    });

    if (!user) {
      const error = new CustomError("Incorrect email or password", 404);

      return next(error);
    }

    const passwordMatch = compareSync(request.body.password, user.password);

    if (!passwordMatch) {
      const error = new CustomError("Incorrect email or password", 404);

      return next(error);
    }

    if (!user.email.verified) {
      const error = new CustomError("Email is not verified", 403);

      return next(error);
    }

    const token = sign({ id: user.id }, process.env.JWT_SECRET_KEY!);

    response.status(200).json({ user: user.toJSON(), token });
  } catch {
    const error = new CustomError("Internal server error.", 500);
    next(error);
  }
};
