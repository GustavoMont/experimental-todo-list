import { enviroment } from "@/infra/enviroment";
import { ServiceError } from "@/infra/errors";
import bcrypt from "bcryptjs";

export class PasswordService {
  private readonly salt: number;
  private readonly pepper: string;

  constructor() {
    const salt = enviroment.getVariable<number>("PASSWORD_SALT");
    const pepper = enviroment.getVariable<string>("PASSWORD_PEPPER");
    if (!salt || !pepper)
      throw new ServiceError({
        action:
          "Adicione o 'PASSWORD_SALT' e 'PASSWORD_PEPPER' as variáveis de ambiente",
        message: "'Salt' e 'Pepper' não configurados",
      });

    this.salt = salt;
    this.pepper = pepper;
  }

  private getTemperedPassword(password: string): string {
    return `${this.pepper}$$${password}`;
  }

  async hash(passwordToHash: string): Promise<string> {
    passwordToHash = this.getTemperedPassword(passwordToHash);

    return await bcrypt.hash(passwordToHash, this.salt);
  }

  async compare(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    plainPassword = this.getTemperedPassword(plainPassword);
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

export const passwordService = new PasswordService();
