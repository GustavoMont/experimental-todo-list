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
import z from "zod";

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

describe("[GET] /api/v1/tasks/[id]", () => {
  describe("Default user", () => {
    test("Retrieving own task", async () => {
      const response = await supertest(server)
        .get(getBaseUrl(task.id))
        .set("Cookie", [defaultAccessToken]);
      expect(response.status).toBe(200);
      const responseBody = response.body;
      expect(responseBody).toEqual({
        id: responseBody.id,
        name: task.name,
        description: task.description,
        userId: user.id,
        dueDate: task.dueDate,
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
    test("Retrieving another user task", async () => {
      const anotherTask = await createTask();

      const response = await supertest(server)
        .get(getBaseUrl(anotherTask.id))
        .set("Cookie", [defaultAccessToken]);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "ForbiddenError",
        message: "Você não tem permissão para visualizar essa tarefa.",
        action: "Verifique se informou a tarefa correta.",
        status_code: 403,
      });
    });
    test("Retrieving nonexisting task", async () => {
      const response = await supertest(server)
        .get(getBaseUrl("a"))
        .set("Cookie", [defaultAccessToken]);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "ForbiddenError",
        message: "Você não tem permissão para visualizar essa tarefa.",
        action: "Verifique se informou a tarefa correta.",
        status_code: 403,
      });
    });
  });
  describe("Anonymous User", () => {
    test("Retrieving an existing task", async () => {
      const response = await supertest(server).get(getBaseUrl(task.id));
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "ForbiddenError",
        message:
          "Usuário não possui permissões necessários para executar essa ação.",
        action: "Verifique se o usuário possui permissão necessária.",
        status_code: 403,
      });
    });
    test("Retrieving a nonexisting task", async () => {
      const response = await supertest(server).get(getBaseUrl("a"));
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
