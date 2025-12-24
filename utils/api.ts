import {
  BaseError,
  InternalServerError,
  NotImplementedError,
  UnauthorizedError,
  ValidationError,
} from "@/infra/errors";
import { NextResponse } from "next/server";
import { formatZodError } from "./error";
import { ZodError } from "zod";

export function onError(error: unknown) {
  const transformedError = handleError(error);
  return NextResponse.json(transformedError, {
    status: transformedError.statusCode,
  });
}

function handleError(error: unknown): BaseError {
  const mappedErrors = [ValidationError, UnauthorizedError];
  if (error instanceof ZodError) {
    return formatZodError(error);
  }
  if (mappedErrors.some((mappedError) => error instanceof mappedError)) {
    return error as BaseError;
  }
  const isDevelopmentMode = process.env.NODE_ENV !== "production";
  if (isDevelopmentMode && error instanceof NotImplementedError) {
    console.error(error);
    return error;
  }
  const internalError = new InternalServerError({ cause: error });
  console.error(internalError);

  return internalError;
}
