import { PrismaClient } from "@/infra/prisma/generated";
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

  async findById(id: string) {
    return this.db.task.findUnique({ where: { id } });
  }

  async deleteById(id: string) {
    return this.db.task.delete({ where: { id } });
  }
}
