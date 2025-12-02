import { PrismaClient } from "@/infra/prisma/generated";
import prisma from "@/lib/prisma";
import { User } from "../@types/user-database.types";

type FindUniqueParams = {
  id?: string;
  email?: string;
  username?: string;
};

export interface IUserRepository {
  create(user: User): Promise<User>;
  findUnique(params: FindUniqueParams): Promise<User>;
}

export class UserRepository implements IUserRepository {
  private readonly db: PrismaClient;
  constructor() {
    this.db = prisma;
  }

  async create(user: User): Promise<User> {
    return this.db.user.create({ data: user });
  }

  findUnique(where: FindUniqueParams): Promise<User> {
    return this.db.user.findUnique({
      where: {
        id: where.id,
        email: where.email,
        username: where.username,
      },
    });
  }
}
