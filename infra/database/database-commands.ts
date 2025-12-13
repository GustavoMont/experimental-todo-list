import prisma from "lib/prisma";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { enviroment } from "../enviroment";

const execAsync = promisify(exec);

export class DatabaseCommand {
  static async clearDatabase() {
    if (process.env.NODE_ENV === "production") return;
    await prisma.$queryRaw`DROP SCHEMA public cascade ;`;
    await prisma.$queryRaw`CREATE SCHEMA public;`;
  }

  static async runPendingMigrations() {
    await execAsync("npm run migrations:up");
  }

  static async flushDatabase() {
    if (process.env.NODE_ENV === "production") return;

    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename != '_prisma_migrations'
      `;
    if (tables.length === 0) return;

    await prisma.$executeRawUnsafe("SET session_replication_role = replica;");
    for (const { tablename } of tables) {
      try {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE;`
        );
      } catch (error) {
        console.error(`Erro ao limpar tabela ${tablename}:`, error);
      }
    }
    await prisma.$executeRawUnsafe("SET session_replication_role = DEFAULT;");
  }

  static getDatabaseCredentials() {
    const { POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER } =
      enviroment.getVariables() || {};
    return {
      password: POSTGRES_PASSWORD,
      user: POSTGRES_USER,
      dbName: POSTGRES_DB,
      containerName: "experimental_todo_postgres",
    };
  }

  static async createDatabase(newDbName: string) {
    const { containerName, dbName, password, user } =
      this.getDatabaseCredentials();
    const dockerExecCommand = `docker exec -e PGPASSWORD=${password} ${containerName} \
      psql -U ${user} -d ${dbName} \
      -c `;
    const { stdout } = await execAsync(
      dockerExecCommand +
        `"SELECT 1 FROM pg_database WHERE datname = '${newDbName}'"`
    );
    if (!stdout.includes("0 rows")) return;

    await execAsync(
      `docker exec -e PGPASSWORD=${password} ${containerName} \
      psql -U ${user} -d ${dbName} \
      -c "CREATE DATABASE ${newDbName};"`
    );
  }
}
