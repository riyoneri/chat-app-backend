export default class CustomError extends Error {
  constructor(
    public message: string,
    public statusCode?: number,
    public errors?: object,
  ) {
    super(message);
  }
}
