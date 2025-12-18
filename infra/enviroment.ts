import "dotenv/config";
import { resolve } from "node:path";
import z from "zod";
import dotenv from "dotenv";

import { expand } from "dotenv-expand";

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
  PASSWORD_SALT: z.coerce.number(),
  PASSWORD_PEPPER: z.string(),
});

type EnvVars = z.infer<typeof envSchema>;

type VarTypes = string | number | null;

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

  getVariables(): EnvVars | NodeJS.ProcessEnv {
    const parseResult = envSchema.safeParse({ ...process.env });

    return parseResult.data || process.env;
  }

  getVariable<T extends VarTypes = VarTypes>(key: keyof EnvVars): T | null {
    const envs = this.getVariables();

    return (envs[key] as T) || null;
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
