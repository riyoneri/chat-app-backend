import { NextFunction, Request, Response } from "express";

import CustomError from "../utils/custom-error";

const ACCEPTED_IMAGE_MIMETYPES = ["jpeg", "png", "jpg", "JPEG", "PNG", "JPG"];
const ACCEPTED_VIDEO_MIMETYPES = ["mp4", "mov", "avi", "MP4", "MOV", "AVI"];
const ACCEPTED_AUDIO_MIMETYPES = ["mp3", "MP3"];

export default function createMessageMiddleware(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  if (!request.busboy) return next();

  request.body.fileError;

  request.busboy
    .on("file", (name, file, { mimeType }) => {
      if (!["image", "video", "voice_note"].includes(name)) {
        file.resume();
        return;
      }

      if (
        name === "image" &&
        !ACCEPTED_IMAGE_MIMETYPES.some((fileMimeType) =>
          mimeType.includes(fileMimeType),
        )
      ) {
        request.body.imageError = "Required extensions are jpeg, png and jpg";

        file.resume();
        return;
      }

      if (
        name === "video" &&
        !ACCEPTED_VIDEO_MIMETYPES.some((fileMimeType) =>
          mimeType.includes(fileMimeType),
        )
      ) {
        request.body.videoError = "Required extensions are mp4, mov and avi";

        file.resume();
        return;
      }

      if (
        name === "voice_note" &&
        !ACCEPTED_AUDIO_MIMETYPES.some((fileMimeType) =>
          mimeType.includes(fileMimeType),
        )
      ) {
        request.body.voiceNoteError = "Required extension is mp3 only";

        file.resume();
        return;
      }

      const buffers: Uint8Array[] = [];

      file
        .on("limit", () => {
          name === "image"
            ? (request.body.imageError =
                "Image is too large. Maximum size is 5MB")
            : (request.body.videoError =
                "Video is too large. Maximum size is 10MB");

          file.resume();
        })
        .on("data", (chunk) => buffers.push(chunk))
        .on("end", () => (request.body[name] = Buffer.concat(buffers)));
    })
    .on("filesLimit", () => {
      request.body.fileError = "Too many files. Maximum is 1";
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
