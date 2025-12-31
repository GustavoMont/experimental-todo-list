import retry from "async-retry";
import { DatabaseCommand } from "@/infra/database/database-commands";
import { CreateUserDTO } from "@/app/users/schemas/user.schema";
import { UserService } from "@/app/users/services/user.service";
import { faker } from "@faker-js/faker";
import { createServer } from "node:http";
import { NextRequest } from "next/server";
import { resolve } from "node:path";
import { NotFoundError, NotImplementedError } from "@/infra/errors";
import { SessionService } from "@/app/sessions/services/session.service";
import { TaskService } from "@/app/tasks/services/task.service";
import { CreateTaskDTO } from "@/app/tasks/schemas/task.schema";
import { readdir } from "node:fs/promises";

const userService = new UserService();
const taskService = new TaskService();
const sessionService = new SessionService();

export async function waitForAllServices() {
  await waitForWebServer();

  async function waitForWebServer() {
    return retry(fetchStatus, {
      retries: 100,
      maxTimeout: 1_000,
      minTimeout: 250,
    });

    async function fetchStatus() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (!response.ok) {
        throw Error();
      }
    }
  }
}

export async function setupDatabase() {
  await DatabaseCommand.clearDatabase();
  await DatabaseCommand.runPendingMigrations();
}

export async function createUser(payload: Partial<CreateUserDTO> = {}) {
  return userService.create({
    email: payload.email || faker.internet.email(),
    username: payload.username || faker.internet.username().replace(/\W/g, "_"),
    password: payload.password || faker.internet.password({ prefix: "9" }),
  });
}

export async function createTask(payload: Partial<CreateTaskDTO> = {}) {
  const userId = payload.userId || (await createUser()).id;
  return taskService.create({
    dueDate: faker.date.future(),
    name: faker.book.title(),
    description: faker.hacker.phrase(),
    ...payload,
    userId,
  });
}

export function createAccessTokenCookie(accessToken: string) {
  return `access_token=${accessToken}`;
}

export async function createSession(userId: string) {
  return sessionService.create({ userId });
}

export function getServerApp() {
  return createServer(async (req, res) => {
    let route;
    let ctx;
    try {
      const { route: routeImport, context } = await getRouteByUrl(req.url);
      route = routeImport;
      ctx = context;
    } catch (error) {
      console.log(error);
      res.statusCode = 404;
      const notFoundError = new NotImplementedError({
        action: "Verifique se a rota está correta",
        message: "Rota não encontrada",
      });
      const jsonError = JSON.stringify(notFoundError.toJSON());
      res.end(jsonError);
      return;
    }
    const methodHandler = route[req.method];
    if (!methodHandler) {
      res.statusCode = 405;
      const notFoundError = new NotImplementedError({
        action: "Verifique se esse método está implementado",
        message: "Rota não encontrada",
      });
      const jsonError = JSON.stringify(notFoundError.toJSON());
      res.end(jsonError);
      return;
    }
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyBuffer = Buffer.concat(chunks);
    const body = bodyBuffer.length > 0 ? bodyBuffer : undefined;
    const url = `http://localhost${req.url}`;
    const nextRequest = new NextRequest(url, {
      body,
      headers: req.headers as HeadersInit,
      method: req.method,
    });

    const response = await methodHandler(nextRequest, ctx);
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
}

async function getRouteByUrl(url: string) {
  const pathArray = url.split("/");
  if (pathArray.length <= 4) {
    const routePath = resolve("app", ...pathArray, "route");
    return { route: await import(routePath) };
  }
  const baseEndpointPathArray = pathArray.slice(0, 4);
  const folders = await readdir(resolve("app", ...baseEndpointPathArray));

  const dynamicRoute = folders.find((folder) => folder.startsWith("["));
  if (dynamicRoute) {
    const routePath = resolve(
      "app",
      ...baseEndpointPathArray,
      dynamicRoute,
      "route"
    );
    const paramName = dynamicRoute.replace(/\[/g, "").replace(/\]/g, "");

    const params = Promise.resolve({ [paramName]: pathArray.at(-1) });
    return { route: await import(routePath), context: { params } };
  }

  throw new NotFoundError({
    message: "Rota não encontrada.",
    action: "Verifique a rota que está sendo testada",
  });
}
