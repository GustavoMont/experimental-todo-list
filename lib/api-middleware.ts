import {
  BaseError,
  InternalServerError,
  NotImplementedError,
  UnauthorizedError,
  ValidationError,
} from "@/infra/errors";
import { formatZodError } from "@/utils/error";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

type TypeOrPromise<T> = T | Promise<T>;

type MiddlewareFn = (
  req: NextRequest,
  responseResult?: NextResponse
) => TypeOrPromise<NextResponse> | TypeOrPromise<void>;

type Endpoint = (req: NextRequest) => Promise<NextResponse>;

export function createEndpoint(...middlewares: MiddlewareFn[]): Endpoint {
  return async (req) => {
    try {
      let lastResponse: NextResponse;
      for (const fn of middlewares) {
        const response = await fn(req, lastResponse);
        lastResponse = response || undefined;
      }
      if (!lastResponse) {
        throw new NotImplementedError({
          message: "É necessário que o último middleware tenha um retorno.",
          action: `Confira os middlewares usados no endpoint [${req.method}] ${req.url}`,
        });
      }

      return lastResponse;
    } catch (error) {
      const transformedError = handleError(error);
      return NextResponse.json(transformedError, {
        status: transformedError.statusCode,
      });
    }
  };
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
