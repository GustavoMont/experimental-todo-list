import retry from "async-retry";
import { DatabaseCommand } from "@/infra/database/database-commands";

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
