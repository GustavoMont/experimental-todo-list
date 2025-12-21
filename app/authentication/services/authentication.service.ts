import { PasswordService } from "@/app/password/services/password.service";
import {
  AuthenticationDTO,
  AuthenticationSchema,
} from "../schemas/authentication.schema";
import { UserService } from "@/app/users/services/user.service";
import { UnauthorizedError } from "@/infra/errors";

class AuthenticationService {
  private readonly schema: AuthenticationSchema;
  private readonly passwordService: PasswordService;
  private readonly userService: UserService;
  constructor() {
    this.schema = new AuthenticationSchema();
    this.passwordService = new PasswordService();
    this.userService = new UserService();
  }

  private comparePassword(
    plainPassword: string,
    hashedPassword: string | undefined
  ): Promise<boolean> {
    const passwordToCompare: string =
      hashedPassword || "senha_pra_enganar_trouxa";
    return this.passwordService.compare(plainPassword, passwordToCompare);
  }

  async getAuthenticatedUser(body: AuthenticationDTO) {
    const validatedData = this.schema.toAuthenticationDTO(body);
    const foundUser = await this.userService.findByEmail(validatedData.email);
    if (!foundUser) {
      await this.comparePassword(validatedData.password, undefined);
      throw new UnauthorizedError({
        action: "Verifique se o e-mail foi digitado corretamente",
        message: "Não existe usuário cadastrado com esse e-mail",
      });
    }
    const isCorrectPassword = await this.comparePassword(
      validatedData.password,
      foundUser.password
    );
    if (!isCorrectPassword) {
      throw new UnauthorizedError({
        action: "Verifique se a senha foi digitada corretamente",
        message: "Senha incorreta",
      });
    }
    return foundUser;
  }
}

export const authenticationService = new AuthenticationService();
