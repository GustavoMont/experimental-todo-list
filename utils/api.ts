import {
  BaseError,
  ForbiddenError,
  InternalServerError,
  NotImplementedError,
  UnauthorizedError,
  ValidationError,
} from "@/infra/errors";
import { NextRequest, NextResponse } from "next/server";
import { formatZodError } from "./error";
import { ZodError } from "zod";
import { EndpointBuilder, MiddlewareFn } from "@/lib/endpoint-builder";
import { NextRequestWithContext } from "@/@types/api";
import { SessionService } from "@/app/sessions/services/session.service";
import { ResponseSessionDTO } from "@/app/sessions/schemas/session.schema";
import { UserService } from "@/app/users/services/user.service";
import { authorizationService } from "@/app/authorization/services/authorization.service";

export function onError(error: unknown) {
  const transformedError = handleError(error);
  return NextResponse.json(transformedError, {
    status: transformedError.statusCode,
  });

  function handleError(error: unknown): BaseError {
    const mappedErrors = [ValidationError, UnauthorizedError, ForbiddenError];
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
}

export function createEndpointWithUser() {
  const endpointBuilder = new EndpointBuilder();
  endpointBuilder.use(injectUserOrAnonymous);

  return endpointBuilder;
}

export function generateAnonymousUser() {
  return { features: ["create:session", "create:user"] };
}

export function canRequest(feature: string): MiddlewareFn {
  return async (req: NextRequestWithContext) => {
    const user = req.context.user || generateAnonymousUser();
    if (!authorizationService.can(user, feature)) {
      throw new ForbiddenError({});
    }
  };
}

async function injectUserOrAnonymous(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    injectAnonymousUser(req);
    return;
  }

  await injectUser(req, session);
}

async function getSession(
  req: NextRequest
): Promise<ResponseSessionDTO | null> {
  const cookies = req.cookies;
  const accessToken = cookies.get("access_token")?.value;
  if (!accessToken) {
    return null;
  }
  const sessionService = new SessionService();
  const session = await sessionService.findValidByToken(accessToken);
  return session;
}

function injectAnonymousUser(req: NextRequestWithContext) {
  const anonymousUser = generateAnonymousUser();
  req.context = { ...req.context, user: anonymousUser };
}

async function injectUser(
  req: NextRequestWithContext,
  session: ResponseSessionDTO
) {
  const userService = new UserService();
  const user = await userService.findById(session.userId);
  req.context = { ...req.context, user };
}
