import { Result, ValidationError } from "express-validator";

export const serializeValidation = (errors: Result<ValidationError>) => {
  let mappedErrors = errors.mapped();
  let refinedErrors: { [key: string]: string } = {};
  for (let key in mappedErrors) refinedErrors[key] = mappedErrors[key]["msg"];

  return refinedErrors;
};
