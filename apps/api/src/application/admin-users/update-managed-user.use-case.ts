import { Inject, Injectable } from "@nestjs/common";
import { ADMIN_USER_REPOSITORY } from "../../domain/tokens";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type {
  IAdminUserRepository,
  ManagedUserEntity,
  UpdateManagedUserInput,
} from "../../domain/admin-users/admin-user.types";

@Injectable()
export class UpdateManagedUserUseCase {
  public constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepository: IAdminUserRepository,
  ) {}

  public async execute(id: string, input: UpdateManagedUserInput): Promise<ManagedUserEntity> {
    const existing = await this.adminUserRepository.findUserById(id);

    if (existing === null) {
      throw new NotFoundException("USER_NOT_FOUND", "User not found");
    }

    if (input.email !== undefined && input.email !== existing.email) {
      const userWithEmail = await this.adminUserRepository.findUserByEmail(input.email);
      if (userWithEmail !== null) {
        throw new ConflictException("USER_EMAIL_ALREADY_EXISTS", "User email already exists");
      }
    }

    return this.adminUserRepository.updateUser(id, input);
  }
}
