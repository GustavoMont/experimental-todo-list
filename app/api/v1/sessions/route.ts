import { authenticationService } from "@/app/authentication/services/authentication.service";
import { SessionService } from "@/app/sessions/services/session.service";
import { UnauthorizedError } from "@/infra/errors";
import { NextRequest, NextResponse } from "next/server";
import { enviroment } from "@/infra/enviroment";
import { cookieService } from "@/infra/cookies";
import {
  canRequest,
  createEndpointWithUser,
  getHeadersWithExpiredToken,
  onError,
} from "@/utils/api";

const endpointBuilder = createEndpointWithUser();

export const { POST, DELETE } = endpointBuilder
  .post(canRequest("create:session"), postHandler)
  .delete(canRequest("delete:session"), deleteHandler)
  .build({ onError });

const sessionService = new SessionService();

async function postHandler(req: NextRequest) {
  try {
    const authenticatedUser = await authenticationService.getAuthenticatedUser(
      await req.json()
    );
    const newSession = await sessionService.create({
      userId: authenticatedUser.id,
    });

    const maxAge = sessionService.getExpirationsInMiliseconds() / 1_000;

    const setCookie = cookieService.createCookie(
      { name: "access_token", value: newSession.token },
      {
        path: "/",
        httpOnly: true,
        secure: enviroment.getVariable("NODE_ENV") === "production",
        maxAge,
      }
    );

    const headers = new Headers();
    headers.set("Set-Cookie", setCookie);

    return NextResponse.json(newSession, { status: 201, headers });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedError({
        cause: error,
        message: "E-mail ou senha incorretos.",
        action: "Verifique se as credenciais foram digitadas corretamente.",
      });
    }
    throw error;
  }
}

async function deleteHandler(req: NextRequest) {
  const accessToken = req.cookies.get("access_token")?.value || "";
  const session = await sessionService.findValidByToken(accessToken);
  await sessionService.expiresById(session.id);
  const headers = getHeadersWithExpiredToken();
  return new NextResponse(null, { headers, status: 204 });
}
