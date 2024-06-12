export default class CustomError extends Error {
  constructor(
    public message: string,
    public statusCode?: number,
    public errors?: { [key: string]: object },
  ) {
    super(message);
  }
}
