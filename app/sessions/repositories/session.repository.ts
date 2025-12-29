import { PrismaClient } from "@/infra/prisma/generated";
import { Session } from "../types/session.types";
import prisma from "@/lib/prisma";

type FindUniqueParams = {
  id?: string;
  token?: string;
};

export class SessionRepository {
  private readonly db: PrismaClient;
  constructor() {
    this.db = prisma;
  }
  async create(session: Session): Promise<Session> {
    return this.db.session.create({ data: session });
  }

  async findUniqueBy(where: FindUniqueParams): Promise<Session | null> {
    return this.db.session.findUnique({
      where: {
        token: where.token,
        id: where.id,
      },
    });
  }
}
