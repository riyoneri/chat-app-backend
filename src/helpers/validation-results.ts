import { Request } from "express";
import { FieldValidationError, validationResult } from "express-validator";

interface TypedError extends FieldValidationError {
  msg: string;
}

const defaultValidationResults = validationResult.withDefaults({
  formatter: (error) => {
    const typedError = error as TypedError;

    return {
      [typedError.path]: {
        location: typedError.location,
        message: typedError.msg,
      },
    };
  },
});

export default function customValidationResult(request: Request) {
  if (validationResult(request).isEmpty()) return false;
  return defaultValidationResults(request).array({ onlyFirstError: true });
}
