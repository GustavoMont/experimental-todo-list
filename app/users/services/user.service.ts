import {
  CreateUserDTO,
  UserResponseDTO,
  UserSchema,
} from "../schemas/user.schema";
import {
  IUserRepository,
  UserRepository,
} from "../repositories/user.repository";
import { ValidationError } from "@/infra/errors";
import {
  passwordService,
  PasswordService,
} from "@/app/password/services/password.service";

export class UserService {
  private readonly userRepository: IUserRepository;
  private readonly passwordService: PasswordService;

  constructor(userRepository?: IUserRepository) {
    this.userRepository = userRepository || new UserRepository();
    this.passwordService = passwordService;
  }

  async findByEmail(email: string): Promise<UserResponseDTO | null> {
    const foundUser = await this.userRepository.findUnique({ email });
    if (!foundUser) {
      return null;
    }
    return UserSchema.toUserResponseDTO(foundUser);
  }

  async findByUsername(username: string): Promise<UserResponseDTO | null> {
    const foundUser = await this.userRepository.findUnique({ username });
    if (!foundUser) {
      return null;
    }
    return UserSchema.toUserResponseDTO(foundUser);
  }

  async create(userInputValues: CreateUserDTO): Promise<UserResponseDTO> {
    const validatedData = UserSchema.toCreateUserDTO(userInputValues);
    const creationData = UserSchema.toDatabaseType(validatedData);
    const [emailUser, usernameUser] = await Promise.all([
      this.findByEmail(creationData.email),
      this.findByUsername(creationData.username),
    ]);
    if (emailUser) {
      throw new ValidationError({
        message: "E-mail já cadastrado no sistema.",
        action: "Utilize outro email para realizar esta operação.",
      });
    }
    if (usernameUser) {
      throw new ValidationError({
        message: "Username já cadastrado no sistema.",
        action: "Utilize outro username para realizar esta operação.",
      });
    }
    creationData.password = await this.passwordService.hash(
      creationData.password
    );
    const createdUser = await this.userRepository.create({
      ...creationData,
      features: this.getDefaultFeatures(),
    });
    return UserSchema.toUserResponseDTO(createdUser);
  }

  async findById(id: string) {
    const user = await this.userRepository.findUnique({ id });
    if (!user) return null;

    return UserSchema.toUserResponseDTO(user);
  }

  getDefaultFeatures(): string[] {
    return [
      "create:session",
      "delete:session",
      "create:task",
      "view:task",
      "delete:task",
    ];
  }
}
