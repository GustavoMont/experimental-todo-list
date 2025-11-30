import "dotenv/config";
import { PrismaClient } from "infra/prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { resolve } from "node:path";
import { expand } from "dotenv-expand";

expand(
  dotenv.config({
    path: resolve(".env.development"),
  })
);

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
