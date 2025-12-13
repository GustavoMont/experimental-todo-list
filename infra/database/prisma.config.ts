import "dotenv/config";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";
import { enviroment } from "../enviroment";

enviroment.config();

export default defineConfig({
  schema: resolve("infra", "prisma", "schema.prisma"),
  migrations: {
    path: resolve("infra", "database", "migrations"),
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
