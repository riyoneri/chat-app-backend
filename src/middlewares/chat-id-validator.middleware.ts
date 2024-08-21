import { NextFunction, Request, Response } from "express";

import customValidationResult from "../helpers/validation-results";
import CustomError from "../utils/custom-error";

export default function chatIdValidatorMiddleware(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const validationResults = customValidationResult(request);
    if (validationResults) {
      const error = new CustomError("Chat id is invalid", 400);

      return next(error);
    }

    next();
  } catch {
    const error = new CustomError("Internal server error.", 500);
    next(error);
  }
}
