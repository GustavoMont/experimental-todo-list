import { UserResponseDTO } from "@/app/users/schemas/user.schema";
import {
  createAccessTokenCookie,
  createSession,
  createUser,
  getServerApp,
} from "@/tests/orchestrator";
import { Server } from "node:http";
import supertest from "supertest";
import z from "zod";

let server: Server;
let user: UserResponseDTO;
let accessToken: string;

const baseUrl = "/api/v1/tasks";

beforeAll(async () => {
  server = getServerApp();
  user = await createUser();
  const session = await createSession(user.id);
  accessToken = createAccessTokenCookie(session.token);
});

describe("[POST] /api/v1/tasks", () => {
  describe("Default User", () => {
    test("With valid partial payload", async () => {
      const payload = {
        name: "Nova tarefa",
        dueDate: new Date().toISOString(),
      };
      const response = await supertest(server)
        .post(baseUrl)
        .set("Cookie", [accessToken])
        .send(payload);
      expect(response.status).toBe(201);
      const responseBody = response.body;
      expect(responseBody).toEqual({
        id: responseBody.id,
        name: payload.name,
        description: null,
        userId: user.id,
        dueDate: payload.dueDate,
        finishedAt: null,
        createdAt: responseBody.createdAt,
        updatedAt: responseBody.updatedAt,
      });
      expect(z.uuidv4().safeParse(responseBody.id).success).toBe(true);
      const createdAt = responseBody.createdAt;
      expect(z.iso.datetime().safeParse(createdAt).success).toBe(true);
      const updatedAt = responseBody.updatedAt;
      expect(z.iso.datetime().safeParse(updatedAt).success).toBe(true);
      const dueDate = responseBody.dueDate;
      expect(z.iso.datetime().safeParse(dueDate).success).toBe(true);
    });
    test("With valid complete payload", async () => {
      const payload = {
        name: "Nova tarefa",
        description: "Descrição top da task",
        dueDate: new Date().toISOString(),
      };
      const response = await supertest(server)
        .post(baseUrl)
        .set("Cookie", [accessToken])
        .send(payload);
      expect(response.status).toBe(201);
      const responseBody = response.body;
      expect(responseBody).toEqual({
        id: responseBody.id,
        name: payload.name,
        description: payload.description,
        userId: user.id,
        dueDate: payload.dueDate,
        finishedAt: null,
        createdAt: responseBody.createdAt,
        updatedAt: responseBody.updatedAt,
      });
      expect(z.uuidv4().safeParse(responseBody.id).success).toBe(true);
      const createdAt = responseBody.createdAt;
      expect(z.iso.datetime().safeParse(createdAt).success).toBe(true);
      const updatedAt = responseBody.updatedAt;
      expect(z.iso.datetime().safeParse(updatedAt).success).toBe(true);
      const dueDate = responseBody.dueDate;
      expect(z.iso.datetime().safeParse(dueDate).success).toBe(true);
    });
    test("With invalid payload", async () => {
      const emptyPayload = {};
      let response = await supertest(server)
        .post(baseUrl)
        .set("Cookie", [accessToken])
        .send(emptyPayload);
      expect(response.status).toBe(400);
      let responseBody = response.body;
      expect(responseBody).toEqual({
        error: "ValidationError",
        message: "Os dados enviados estão inválidos.",
        action: "Confira todos os dados enviados ou contate o time de suporte.",
        issues: responseBody.issues,
        status_code: 400,
      });

      expect(responseBody.issues).toEqual([
        {
          field: "name",
          message: "Nome da tarefa é obrigatório.",
          action: "Confira se o nome da tarefa foi inserido.",
        },
        {
          field: "dueDate",
          message: "O prazo da tarefa é obrigatório.",
          action: "Confira se o prazo foi inserido.",
        },
      ]);
      const invalidPayload = {
        name: Array.from({ length: 101 }).map(String).join(),
        description: Array.from({ length: 8_000 }).map(String).join(),
        dueDate: "inválido",
      };
      response = await supertest(server)
        .post(baseUrl)
        .set("Cookie", [accessToken])
        .send(invalidPayload);
      expect(response.status).toBe(400);
      responseBody = response.body;
      expect(responseBody).toEqual({
        error: "ValidationError",
        message: "Os dados enviados estão inválidos.",
        action: "Confira todos os dados enviados ou contate o time de suporte.",
        issues: responseBody.issues,
        status_code: 400,
      });

      expect(responseBody.issues).toEqual([
        {
          field: "name",
          message: "O nome deve ter no máximo 100 caracteres.",
          action: "Reescreva o nome da tarefa de maneira mais resumida.",
        },
        {
          field: "description",
          message: "O descrição deve ter no máximo 8000 caracteres.",
          action: "Reescreva a descrição da tarefa de maneira mais resumida.",
        },
        {
          field: "dueDate",
          message: "O prazo da tarefa é obrigatório.",
          action: "Confira se o prazo foi inserido.",
        },
      ]);
    });
  });
  describe("With Anonymous user", () => {
    test("With valid request", async () => {
      const response = await supertest(server).post(baseUrl).send({
        name: "Nova tarefa",
        description: "Descrição",
        dueDate: new Date().toISOString(),
      });
      expect(response.status).toBe(403);
      const responseBody = response.body;
      expect(responseBody).toEqual({
        error: "ForbiddenError",
        message:
          "Usuário não possui permissões necessários para executar essa ação.",
        action: "Verifique se o usuário possui permissão necessária.",
        status_code: 403,
      });
    });
  });
});
