import "dotenv/config";
import { resolve } from "node:path";
import z from "zod";
import dotenv from "dotenv";

import { expand } from "dotenv-expand";

class Enviroment {
  getDevelopmentEnvPath(): string[] {
    return [resolve(".env.development")];
  }
  getTestEnvPath(): string[] {
    return [resolve(".env.test")];
  }
  getEnvPathByEnviroment() {
    const defaultPath = this.getDevelopmentEnvPath();
    if (process.env.NODE_ENV === "test") {
      return [...this.getTestEnvPath(), ...defaultPath];
    }
    return defaultPath;
  }

  getVariables() {
    const envSchema = z.object({
      POSTGRES_PASSWORD: z.string(),
      POSTGRES_HOST: z.string(),
      POSTGRES_PORT: z.coerce.number(),
      POSTGRES_USER: z.string(),
      POSTGRES_DB: z.string(),
      DATABASE_URL: z.string(),
      NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    });

    const parseResult = envSchema.safeParse({ ...process.env });

    return parseResult.data || process.env;
  }

  config() {
    expand(
      dotenv.config({
        path: this.getEnvPathByEnviroment(),
      })
    );
  }
}

export const enviroment = new Enviroment();
