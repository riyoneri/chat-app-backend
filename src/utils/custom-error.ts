import { Location } from "express-validator";

export default class CustomError extends Error {
  constructor(
    public message: string,
    public statusCode?: number,
    public errors?: {
      [key: string]: { location: Location; message: string };
    }[],
  ) {
    super(message);
  }
}
