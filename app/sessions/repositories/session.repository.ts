import { PrismaClient } from "@/infra/prisma/generated";
import { Session } from "../types/session.types";
import prisma from "@/lib/prisma";

export class SessionRepository {
  private readonly db: PrismaClient;
  constructor() {
    this.db = prisma;
  }
  async create(session: Session): Promise<Session> {
    return this.db.session.create({ data: session });
  }
}
