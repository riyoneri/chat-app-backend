import { NextFunction, Request, Response } from "express";

import CustomError from "../utils/custom-error";

export const register = async (
  _request: Request,
  response: Response,
  next: NextFunction,
) => {
  try {
    response.status(500).json("Lion");
  } catch {
    const error = new CustomError("Internal server error.", 500);
    next(error);
  }
};
