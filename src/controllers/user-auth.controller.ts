import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { hashSync } from "bcrypt";
import { NextFunction, Request, Response } from "express";
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

    const newUser = new User({
      ...request.body,
      "email.value": request.body.email,
      password: hashedPassword,
      imageUrl: Key,
    });

    const savedUser = await newUser.save();

    await sendVerificationEmail(
      request.body.redirectUrl,
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
