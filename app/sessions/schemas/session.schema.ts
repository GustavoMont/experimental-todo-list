import z from "zod";
import { Session } from "../types/session.types";

const createSessionSchema = z.object({
  userId: z.string(),
});

const updateSessionSchema = z.object({
  expiresAt: z.coerce.date(),
});

const responseSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  token: z.string(),
  expiresAt: z.coerce.date().transform((v) => v.toISOString()),
  createdAt: z.coerce.date().transform((v) => v.toISOString()),
  updatedAt: z.coerce.date().transform((v) => v.toISOString()),
});

export type CreateSessionDTO = z.infer<typeof createSessionSchema>;
export type UpdateSessionDTO = z.infer<typeof updateSessionSchema>;
export type ResponseSessionDTO = z.infer<typeof responseSessionSchema>;

export class SessionSchema {
  toCreateSessionDTO(body: unknown) {
    return createSessionSchema.parse(body);
  }

  toUpdateSessionDTO(body: unknown) {
    return updateSessionSchema.parse(body);
  }

  toResponseDTO(session: Session): ResponseSessionDTO {
    const result = responseSessionSchema.safeParse(session);

    return result.data;
  }

  toSessionRepository(session: Partial<Session>): Session {
    return {
      id: session.id ?? undefined,
      token: session.token ?? undefined,
      userId: session.userId ?? undefined,
      expiresAt: session.expiresAt ?? undefined,
      updatedAt: session.updatedAt ?? undefined,
      createdAt: session.createdAt ?? undefined,
    };
  }
}

export const sessionSchema = new SessionSchema();
