import "dotenv/config";
import dotenv from "dotenv";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";
import { expand } from "dotenv-expand";

expand(
  dotenv.config({
    path: resolve(".env.development"),
  })
);

export default defineConfig({
  schema: resolve("infra", "prisma", "schema.prisma"),
  migrations: {
    path: resolve("infra", "database", "migrations"),
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
