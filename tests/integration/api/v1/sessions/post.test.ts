import { SessionService } from "@/app/sessions/services/session.service";
import { UserResponseDTO } from "@/app/users/schemas/user.schema";
import { cookieService } from "@/infra/cookies";
import { createUser, getServerApp } from "@/tests/orchestrator";
import { Server } from "node:http";
import supertest from "supertest";

let server: Server;
const email = "email@certo.com";
const password = "s3nhaC3rta";
let user: UserResponseDTO;

const sessionService = new SessionService();

beforeAll(async () => {
  server = getServerApp();
  user = await createUser({ email, password });
});

afterAll(() => server?.close());

describe("[POST] /sessions", () => {
  describe("Anonymous user", () => {
    test("With valid data", async () => {
      const response = await supertest(server).post("/api/v1/sessions").send({
        email,
        password,
      });
      expect(response.status).toBe(201);
      const session = response.body;
      expect(response.body).toEqual({
        id: session.id,
        userId: user.id,
        token: session.token,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });

      expect(Date.parse(session.expiresAt)).not.toBeNaN();
      expect(Date.parse(session.createdAt)).not.toBeNaN();
      expect(Date.parse(session.updatedAt)).not.toBeNaN();

      const expiresAt = new Date(session.expiresAt);
      const createdAt = new Date(session.createdAt);
      expiresAt.setMilliseconds(0);
      createdAt.setMilliseconds(0);
      expect(Number(expiresAt) - Number(createdAt)).toBe(
        sessionService.getExpirationsInMiliseconds()
      );
      const combinedCookieHeader = response.headers["set-cookie"];
      const parsedCookie = cookieService.parseCookie(combinedCookieHeader);
      expect(parsedCookie.access_token).toEqual({
        name: "access_token",
        value: session.token,
        httpOnly: true,
        path: "/",
        maxAge: sessionService.getExpirationsInMiliseconds() / 1000, // in seconds
      });
    });
    test("With wrong 'email'", async () => {
      const response = await supertest(server).post("/api/v1/sessions").send({
        email: "wrong@email.com",
        password,
      });
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "UnauthorizedError",
        message: "E-mail ou senha incorretos.",
        action: "Verifique se as credenciais foram digitadas corretamente.",
        status_code: 401,
      });
    });
    test("With wrong 'password'", async () => {
      const response = await supertest(server).post("/api/v1/sessions").send({
        password: "wrongpassword",
      });
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: "UnauthorizedError",
        message: "E-mail ou senha incorretos.",
        action: "Verifique se as credenciais foram digitadas corretamente.",
        status_code: 401,
      });
    });
  });
});
