import { Inject, Injectable } from "@nestjs/common";
import { ADMIN_USER_REPOSITORY } from "../../domain/tokens";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { IAdminUserRepository } from "../../domain/admin-users/admin-user.types";

@Injectable()
export class DeactivateManagedUserUseCase {
  public constructor(
    @Inject(ADMIN_USER_REPOSITORY)
    private readonly adminUserRepository: IAdminUserRepository,
  ) {}

  public async execute(input: { actorUserId: string; targetUserId: string }): Promise<void> {
    if (input.actorUserId === input.targetUserId) {
      throw new ForbiddenException(
        "SELF_DEACTIVATION_NOT_ALLOWED",
        "Users cannot deactivate themselves",
      );
    }

    const existing = await this.adminUserRepository.findUserById(input.targetUserId);

    if (existing === null) {
      throw new NotFoundException("USER_NOT_FOUND", "User not found");
    }

    await this.adminUserRepository.deactivateUser(input.targetUserId);
    await this.adminUserRepository.revokeAllSessionsByUserId(input.targetUserId);
    await this.adminUserRepository.incrementUserTokenVersion(input.targetUserId);
  }
}
