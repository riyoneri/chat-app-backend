import { NextFunction, Request, Response } from "express";

export const getAllUsers = (
  _request: Request,
  response: Response,
  _next: NextFunction,
) => {
  response.status(400).json({ message: "LION" });
};
