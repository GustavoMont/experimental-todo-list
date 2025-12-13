import retry from "async-retry";
import { DatabaseCommand } from "@/infra/database/database-commands";
import { CreateUserDTO } from "@/app/users/schemas/user.schema";
import { UserService } from "@/app/users/services/user.service";
import { faker } from "@faker-js/faker";
import { createServer } from "node:http";
import { NextRequest } from "next/server";
import { resolve } from "node:path";

const userService = new UserService();

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

export function getServerApp() {
  return createServer(async (req, res) => {
    const pathArray = req.url.split("/");
    const routePath = resolve("app", ...pathArray, "route");
    const route = await import(routePath);
    if (!route) throw new Error("Rota inválida");
    const methodHandler = route[req.method];
    if (!methodHandler) throw new Error("Método inválido");
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

    const response = await methodHandler(nextRequest);
    res.statusCode = response.status;
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
}
