import { Inject, Injectable } from "@nestjs/common";
import { ADMIN_USER_REPOSITORY } from "../../domain/tokens";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
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

  public async execute(
    input: {
      actorUserId: string;
      targetUserId: string;
      updates: UpdateManagedUserInput;
    },
  ): Promise<ManagedUserEntity> {
    const id = input.targetUserId;
    const existing = await this.adminUserRepository.findUserById(id);

    if (existing === null) {
      throw new NotFoundException("USER_NOT_FOUND", "User not found");
    }

    if (
      input.actorUserId === input.targetUserId &&
      input.updates.role !== undefined &&
      input.updates.role !== existing.role
    ) {
      throw new ForbiddenException(
        "SELF_ROLE_CHANGE_NOT_ALLOWED",
        "Users cannot change their own role through admin management",
      );
    }

    if (input.updates.email !== undefined && input.updates.email !== existing.email) {
      const userWithEmail = await this.adminUserRepository.findUserByEmail(input.updates.email);
      if (userWithEmail !== null) {
        throw new ConflictException("USER_EMAIL_ALREADY_EXISTS", "User email already exists");
      }
    }

    return this.adminUserRepository.updateUser(id, input.updates);
  }
}
