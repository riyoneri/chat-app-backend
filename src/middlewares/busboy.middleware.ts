import { NextFunction, Request, Response } from "express";

import CustomError from "../utils/custom-error";

export default function busboy(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  request.body = {};
  if (!request.busboy) return next();

  request.body.fileErrors;

  request.busboy
    .on("file", (name, file, { mimeType }) => {
      if (name !== "image") {
        file.resume();
        return;
      }

      request.body.image = "available";

      if (!["image/jpeg", "image/png", "image/jpg"].includes(mimeType)) {
        request.body.fileErrors = "The file must be an image";

        file.resume();
        return;
      }

      const buffers: Uint8Array[] = [];

      file
        .on("data", (chunk) => buffers.push(chunk))
        .on("end", () => (request.body.image = Buffer.concat(buffers)));
    })
    .on("filesLimit", () => {
      request.body.fileErrors = "Too many files. Maximum is 1";
    })
    .on("field", (name, value) => {
      request.body[name] = value;
    })
    .on("error", () => {
      const error = new CustomError("Internal server error");

      next(error);
    })
    .on("finish", () => next());

  request.pipe(request.busboy);
}