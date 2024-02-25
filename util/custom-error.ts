export default class CustomError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public errors?: { [key: string]: string },
  ) {
    super(message);
  }
}
