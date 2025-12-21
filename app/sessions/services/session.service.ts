import { SessionRepository } from "../repositories/session.repository";
import {
  CreateSessionDTO,
  ResponseSessionDTO,
  sessionSchema,
  SessionSchema,
} from "../schemas/session.schema";
import { randomBytes } from "node:crypto";

export class SessionService {
  private readonly sessionRepository: SessionRepository;
  private readonly schema: SessionSchema;
  constructor() {
    this.sessionRepository = new SessionRepository();
    this.schema = sessionSchema;
  }

  getExpirationsInMiliseconds(): number {
    return 1_000 * 60 * 60 * 24 * 7; // seven days
  }

  private generateExpiresAt(): Date {
    return new Date(Date.now() + this.getExpirationsInMiliseconds());
  }
  private generateToken(): string {
    return randomBytes(48).toString("hex");
  }

  async create(body: CreateSessionDTO): Promise<ResponseSessionDTO> {
    const validated = this.schema.toCreateSessionDTO(body);
    const expiresAt = this.generateExpiresAt();
    const token = this.generateToken();
    const sessionPayload = this.schema.toSessionRepository({
      ...validated,
      token,
      expiresAt,
    });
    const createdSession = await this.sessionRepository.create(sessionPayload);
    return this.schema.toResponseDTO(createdSession);
  }
}
