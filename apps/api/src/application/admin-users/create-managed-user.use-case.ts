import { Inject, Injectable } from "@nestjs/common";
import { ADMIN_USER_REPOSITORY, HASH_PROVIDER } from "../../domain/tokens";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import type {
  CreateManagedUserInput,
  IAdminUserRepository,
  ManagedUserEntity,
} from "../../domain/admin-users/admin-user.types";
import type { IHashProvider } from "../../domain/auth/ihash-provider";

@Injectable()
export class CreateManagedUserUseCase {
  public constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepository: IAdminUserRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
  ) {}

  public async execute(input: CreateManagedUserInput): Promise<ManagedUserEntity> {
    const existing = await this.adminUserRepository.findUserByEmail(input.email);

    if (existing !== null) {
      throw new ConflictException("USER_EMAIL_ALREADY_EXISTS", "User email already exists");
    }

    const passwordHash = await this.hashProvider.hash(input.password);

    return this.adminUserRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    });
  }
}
