import { Request } from "express";
import { FieldValidationError, validationResult } from "express-validator";

interface TypedError extends FieldValidationError {
  msg: string;
}

export default function customValidationResult(request: Request) {
  if (validationResult(request).isEmpty()) return false;

  return validationResult(request)
    .array({ onlyFirstError: true })
    .reduce((previousErrors, currentError) => {
      const typedValue = currentError as TypedError;

      return {
        ...previousErrors,
        [typedValue.path]: {
          location: typedValue.location,
          message: typedValue.msg,
        },
      };
    }, {});
}
