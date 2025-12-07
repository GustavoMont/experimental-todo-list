import retry from "async-retry";
import { DatabaseCommand } from "@/infra/database/database-commands";
import { CreateUserDTO } from "@/app/users/schemas/user.schema";
import { UserService } from "@/app/users/services/user.service";
import { faker } from "@faker-js/faker";

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
