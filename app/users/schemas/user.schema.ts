import z from "zod";
import { User } from "../@types/user-database.types";
import { createFieldIssue } from "@/utils/error";

const createUserSchema = z.object({
  email: z.email({
    error: createFieldIssue(
      "E-mail inválido.",
      "Confira se digitou o e-mail corretamente."
    ),
  }),
  username: z.string().regex(/^[a-zA-Z_\d.]{3,}$/, {
    error: createFieldIssue(
      "Username inválido.",
      "Use um username com no mínimo 3 letras e sem caracteres especiais."
    ),
  }),
  password: z.string().regex(/^(?=.*[a-zA-Z])(?=.*\d).{10,}$/, {
    error: createFieldIssue(
      "Senha muito fraca.",
      "A senha no mínimo 10 caracteres e conter letras e números."
    ),
  }),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;

export type UserResponseDTO = {
  id: string;
  password: string;
  email: string;
  features: string[];
  username: string;
  createdAt: string;
  updatedAt: string;
};

export class UserSchema {
  static toCreateUserDTO(body: unknown) {
    return createUserSchema.parse(body);
  }

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
      features: user.features || [],
    };
  }
}
