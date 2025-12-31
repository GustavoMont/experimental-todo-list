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

describe("[DELETE] /api/v1/tasks/[id]", () => {
  describe("Default user", () => {
    test("Deleting own task", async () => {
      const response = await supertest(server)
        .delete(getBaseUrl(task.id))
        .set("Cookie", [defaultAccessToken]);
      expect(response.status).toBe(204);

      // check if it's deleted
      const validationResponse = await supertest(server)
        .delete(getBaseUrl(task.id))
        .set("Cookie", [defaultAccessToken]);
      expect(validationResponse.status).not.toBe(204);
    });
    test("Deleting another user task", async () => {
      const anotherTask = await createTask();

      const response = await supertest(server)
        .delete(getBaseUrl(anotherTask.id))
        .set("Cookie", [defaultAccessToken]);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "ForbiddenError",
        message: "Você não tem permissão para deletar essa tarefa.",
        action: "Verifique se informou a tarefa correta.",
        status_code: 403,
      });
    });
    test("Deleting nonexisting task", async () => {
      const response = await supertest(server)
        .delete(getBaseUrl("a"))
        .set("Cookie", [defaultAccessToken]);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "ForbiddenError",
        message: "Você não tem permissão para deletar essa tarefa.",
        action: "Verifique se informou a tarefa correta.",
        status_code: 403,
      });
    });
  });
  describe("Anonymous User", () => {
    test("Deleting an existing task", async () => {
      const response = await supertest(server).delete(getBaseUrl(task.id));
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: "ForbiddenError",
        message:
          "Usuário não possui permissões necessários para executar essa ação.",
        action: "Verifique se o usuário possui permissão necessária.",
        status_code: 403,
      });
    });
    test("Deleting a nonexisting task", async () => {
      const response = await supertest(server).delete(getBaseUrl("a"));
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
