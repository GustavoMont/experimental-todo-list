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

beforeAll(async () => {
  server = getServerApp();
  user = await createUser();
  const tasksPromises = Array.from({ length: 10 }).map((_, index) => {
    const userId = index % 2 === 0 ? user.id : undefined;
    return createTask({ userId });
  });
  await Promise.all(tasksPromises);

  const session = await createSession(user.id);
  defaultAccessToken = createAccessTokenCookie(session.token);
});

const baseUrl = "/api/v1/tasks";

describe("[GET] /api/v1/tasks", () => {
  describe("Default User", () => {
    test("List all tasks", async () => {
      const response = await supertest(server)
        .get(baseUrl)
        .set("Cookie", [defaultAccessToken]);
      expect(response.status).toBe(200);
      const tasks = response.body;
      expect(tasks).toHaveLength(5);
      for (const task of tasks) {
        expect(task.userId).toBe(user.id);
      }
    });
  });
  describe("Anonymous User", () => {
    test("List all tasks", async () => {
      const response = await supertest(server).get(baseUrl);
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
