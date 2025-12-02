import {
  CreateInput,
  UserResponseDTO,
  UserSchema,
} from "../schemas/user.schema";
import {
  IUserRepository,
  UserRepository,
} from "../repositories/user.repository";
import { ValidationError } from "@/infra/errors";

export class UserService {
  private readonly userRepository: IUserRepository;
  constructor(userRepository?: IUserRepository) {
    this.userRepository = userRepository || new UserRepository();
  }

  async findByEmail(email: string): Promise<UserResponseDTO> {
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

  async create(userInputValues: CreateInput): Promise<UserResponseDTO> {
    const creationData = UserSchema.toDatabaseType(userInputValues);
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
    const createdUser = await this.userRepository.create(creationData);
    return UserSchema.toUserResponseDTO(createdUser);
  }
}
