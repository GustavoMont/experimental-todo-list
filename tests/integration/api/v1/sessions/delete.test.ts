import { SessionService } from "@/app/sessions/services/session.service";
import { cookieService } from "@/infra/cookies";
import { createSession, createUser, getServerApp } from "@/tests/orchestrator";
import { Server } from "node:http";
import supertest from "supertest";

let server: Server;
const sessionService = new SessionService();

beforeAll(() => {
  server = getServerApp();
});

describe("DELETE /api/v1/sessions", () => {
  describe("Default User", () => {
    test("With valid session", async () => {
      const createdUser = await createUser({
        username: "username",
      });
      const createdSession = await createSession(createdUser.id);
      const response = await supertest(server)
        .delete("/api/v1/sessions")
        .set("Cookie", [`access_token=${createdSession.token}`]);

      expect(response.status).toBe(204);
      const expiredSession = await sessionService.findById(createdSession.id);
      expect(expiredSession.expiresAt < createdSession.expiresAt).toBe(true);
      expect(expiredSession.updatedAt > createdSession.updatedAt).toBe(true);

      const setCookie = cookieService.parseCookie(
        response.headers["set-cookie"]
      );
      expect(setCookie.access_token).toEqual({
        name: "access_token",
        value: "invalid",
        httpOnly: true,
        path: "/",
        maxAge: -1,
      });
    });
    test("With nonexistent session", async () => {
      const nonexistentToken =
        "408cb3efd0dfdc0ee40d5bb56141ec8c1b2bd086bced1245d11c65f89d080627af351d2b191100fa86450b1943439810";

      const response = await supertest(server)
        .delete("/api/v1/sessions")
        .set("Cookie", [`access_token=${nonexistentToken}`]);

      expect(response.status).toBe(403);
      const responseBody = response.body;

      expect(responseBody).toEqual({
        error: "ForbiddenError",
        message:
          "Usuário não possui permissões necessários para executar essa ação.",
        action: "Verifique se o usuário possui permissão necessária.",
        status_code: 403,
      });
      // Set-Cookie assertions
      const parsedSetCookie = cookieService.parseCookie(
        response.headers["set-cookie"]
      );

      expect(parsedSetCookie.access_token).toEqual({
        name: "access_token",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });
    });
    test("With expired session", async () => {
      jest.useFakeTimers({
        now: new Date(
          Date.now() - sessionService.getExpirationsInMiliseconds()
        ),
      });
      const createdUser = await createUser({
        username: "user_with_expired_session",
      });
      const createdSession = await createSession(createdUser.id);
      jest.useRealTimers();
      const response = await supertest(server)
        .delete("/api/v1/sessions")
        .set("Cookie", [`access_token=${createdSession.token}`]);

      expect(response.status).toBe(403);
      const body = response.body;
      expect(body).toEqual({
        error: "ForbiddenError",
        message:
          "Usuário não possui permissões necessários para executar essa ação.",
        action: "Verifique se o usuário possui permissão necessária.",
        status_code: 403,
      });

      // Set-Cookie assertions
      const parsedSetCookie = cookieService.parseCookie(
        response.headers["set-cookie"]
      );

      expect(parsedSetCookie.access_token).toEqual({
        name: "access_token",
        value: "invalid",
        maxAge: -1,
        path: "/",
        httpOnly: true,
      });
    });
  });
});
