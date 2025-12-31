import { Prisma, PrismaClient } from "@/infra/prisma/generated";
import prisma from "@/lib/prisma";
import { Task } from "../types/task.types";

export class TaskRepository {
  private readonly db: PrismaClient;
  constructor() {
    this.db = prisma;
  }

  create(task: Task) {
    return this.db.task.create({ data: task });
  }

  findMany(where: Prisma.TaskWhereInput = {}) {
    return this.db.task.findMany({
      where,
    });
  }

  findById(id: string) {
    return this.db.task.findUnique({ where: { id } });
  }

  deleteById(id: string) {
    return this.db.task.delete({ where: { id } });
  }
}
