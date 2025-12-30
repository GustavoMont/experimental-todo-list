import { passwordService } from "@/app/password/services/password.service";
import { UserService } from "@/app/users/services/user.service";
import { createSession, createUser, getServerApp } from "@/tests/orchestrator";
import { Server } from "node:http";
import supertest from "supertest";

let server: Server;
const userService = new UserService();

beforeAll(() => {
  server = getServerApp();
});

afterAll(() => server?.close());

describe("[POST] /api/v1/users", () => {
  describe("Anonymous user", () => {
    test("With valid data", async () => {
      const testPassword = "test_p4assword";
      const response = await supertest(server).post("/api/v1/users").send({
        username: "username",
        email: "email@email.com",
        password: testPassword,
      });
      expect(response.status).toBe(201);
      const responseBody = response.body;
      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "username",
        email: "email@email.com",
        features: userService.getDefaultFeatures(),
        password: responseBody.password,
        createdAt: responseBody.createdAt,
        updatedAt: responseBody.updatedAt,
      });
      expect(Date.parse(responseBody.createdAt)).not.toBeNaN();
      expect(Date.parse(responseBody.updatedAt)).not.toBeNaN();

      expect(responseBody.password).not.toBe(testPassword);
      expect(
        await passwordService.compare(testPassword, responseBody.password)
      ).toBe(true);
    });
    test("With invalid data", async () => {
      const response = await supertest(server).post("/api/v1/users").send({
        username: "a_ ",
        email: "a",
        password: "1234",
      });

      expect(response.status).toBe(400);
      const responseBody = response.body;
      expect(responseBody).toEqual({
        error: "ValidationError",
        message: "Os dados enviados estão inválidos.",
        action: "Confira todos os dados enviados ou contate o time de suporte.",
        issues: responseBody.issues,
        status_code: 400,
      });

      expect(responseBody.issues).toEqual([
        {
          field: "email",
          message: "E-mail inválido.",
          action: "Confira se digitou o e-mail corretamente.",
        },
        {
          field: "username",
          message: "Username inválido.",
          action:
            "Use um username com no mínimo 3 letras e sem caracteres especiais.",
        },
        {
          field: "password",
          message: "Senha muito fraca.",
          action: "A senha no mínimo 10 caracteres e conter letras e números.",
        },
      ]);
    });
    test("With duplicated 'email'", async () => {
      await createUser({
        email: "email@duplicado.com",
      });

      const response = await supertest(server).post("/api/v1/users").send({
        username: "new_username",
        email: "email@duplicado.com",
        password: "sup3rs3nha",
      });
      expect(response.status).toBe(400);
      const responseBody = response.body;
      expect(responseBody).toEqual({
        error: "ValidationError",
        message: "E-mail já cadastrado no sistema.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });
    test("With duplicated 'username'", async () => {
      await createUser({
        username: "username_duplicado",
      });

      const response = await supertest(server).post("/api/v1/users").send({
        email: "new_email@email.com",
        username: "username_duplicado",
        password: "sup3rs3nha",
      });
      expect(response.status).toBe(400);
      const responseBody = response.body;
      expect(responseBody).toEqual({
        error: "ValidationError",
        message: "Username já cadastrado no sistema.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });
  });
  describe("With Default User", () => {
    test("Without required permission", async () => {
      const createdUser = await createUser();
      const session = await createSession(createdUser.id);
      const testPassword = "test_p4$$W0rd";
      const response = await supertest(server)
        .post("/api/v1/users")
        .set("Cookie", [`access_token=${session.token}`])
        .send({
          username: "username_1",
          email: "email_1@email.com",
          password: testPassword,
        });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "ForbiddenError",
        message:
          "Usuário não possui permissões necessários para executar essa ação.",
        action: "Verifique se o usuário possui permissão necessária.",
        status_code: 403,
      });
    });
  });
});
