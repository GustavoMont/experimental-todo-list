import { ResponseTaskDTO } from "@/app/tasks/schemas/task.schema";
import { UserResponseDTO } from "@/app/users/schemas/user.schema";
import {
  createUser,
  getServerApp,
  createAccessTokenCookie,
  createSession,
  createTask,
} from "@/tests/orchestrator";
import { Server } from "node:http";
import supertest from "supertest";

let server: Server;
let defaultAccessToken: string;
let user: UserResponseDTO;
let task: ResponseTaskDTO;

beforeAll(async () => {
  server = getServerApp();
  user = await createUser();
  task = await createTask({ userId: user.id });
  const session = await createSession(user.id);
  defaultAccessToken = createAccessTokenCookie(session.token);
});

describe("[PATCH] /api/v1/tasks/[id]", () => {
  describe("Default user", () => {
    test("Updating all own task fields", async () => {
      const payload = {
        name: "Novo nome",
        description: "Nova descrição",
        finishedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() - 1_000 * 60 * 60).toISOString(),
      };
      const response = await supertest(server)
        .patch(getBaseUrl(task.id))
        .send(payload)
        .set("Cookie", [defaultAccessToken]);
      expect(response.status).toBe(200);
      const responseBody = response.body;
      expect(responseBody).toEqual({
        id: task.id,
        userId: user.id,
        name: payload.name,
        description: payload.description,
        dueDate: payload.dueDate,
        finishedAt: payload.finishedAt,
        createdAt: task.createdAt,
        updatedAt: responseBody.updatedAt,
      });

      const updatedAt = responseBody.updatedAt;
      expect(updatedAt > task.createdAt).toBe(true);
    });
    test("Updating partial own task field", async () => {
      const newTask = await createTask({ userId: user.id });
      const payload = {
        description: null,
        finishedAt: new Date().toISOString(),
      };
      const response = await supertest(server)
        .patch(getBaseUrl(newTask.id))
        .send(payload)
        .set("Cookie", [defaultAccessToken]);

      expect(response.status).toBe(200);
      const responseBody = response.body;
      expect(responseBody).toEqual({
        id: newTask.id,
        userId: user.id,
        name: newTask.name,
        description: payload.description,
        dueDate: newTask.dueDate,
        finishedAt: payload.finishedAt,
        createdAt: newTask.createdAt,
        updatedAt: responseBody.updatedAt,
      });

      const updatedAt = responseBody.updatedAt;
      expect(updatedAt > task.createdAt).toBe(true);
    });

    test("Updating sending invalid data", async () => {
      const invalidPayload = {
        name: Array.from({ length: 101 }).map(String).join(),
        description: Array.from({ length: 8_000 }).map(String).join(),
        dueDate: "inválido",
        finishedAt: "inválido",
      };
      const response = await supertest(server)
        .patch(getBaseUrl(task.id))
        .set("Cookie", [defaultAccessToken])
        .send(invalidPayload);

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
          message: "Insira um prazo válido.",
          action: "Confira se o prazo foi inserido corretamente.",
        },
        {
          field: "finishedAt",
          message: "Insira uma data de finalização válida.",
          action: "Confira se a data inserida está correta.",
        },
      ]);
    });

    test("Updating another user task", async () => {
      const anotherTask = await createTask();

      const response = await supertest(server)
        .patch(getBaseUrl(anotherTask.id))
        .set("Cookie", [defaultAccessToken]);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "ForbiddenError",
        message: "Você não tem permissão para atualizar essa tarefa.",
        action: "Verifique se informou a tarefa correta.",
        status_code: 403,
      });
    });
    test("Updating nonexisting task", async () => {
      const response = await supertest(server)
        .patch(getBaseUrl("a"))
        .set("Cookie", [defaultAccessToken]);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "ForbiddenError",
        message: "Você não tem permissão para atualizar essa tarefa.",
        action: "Verifique se informou a tarefa correta.",
        status_code: 403,
      });
    });
  });
  describe("Anonymous User", () => {
    test("Updating an existing task", async () => {
      const response = await supertest(server).patch(getBaseUrl(task.id));
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "ForbiddenError",
        message:
          "Usuário não possui permissões necessários para executar essa ação.",
        action: "Verifique se o usuário possui permissão necessária.",
        status_code: 403,
      });
    });
    test("Updating a nonexisting task", async () => {
      const response = await supertest(server).patch(getBaseUrl("a"));
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

function getBaseUrl(id: string) {
  return `/api/v1/tasks/${id}`;
}
