import { User } from "../@types/user-database.types";

export type CreateInput = {
  email: string;
  username: string;
  password: string;
};

export type UserResponseDTO = {
  id: string;
  password: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
};

export class UserSchema {
  static toUserResponseDTO(user: User): UserResponseDTO {
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.createdAt.toISOString(),
    };
  }

  static toDatabaseType(user: Partial<User>): User {
    return {
      id: user.id || undefined,
      createdAt: user.createdAt || undefined,
      email: user.email || undefined,
      password: user.password || undefined,
      updatedAt: user.updatedAt || undefined,
      username: user.username || undefined,
    };
  }
}
