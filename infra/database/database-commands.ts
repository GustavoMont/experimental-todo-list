import prisma from "lib/prisma";
import { exec } from "node:child_process";
import { promisify } from "node:util";

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
}
