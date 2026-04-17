import { Inject, Injectable } from "@nestjs/common";
import { AUTH_SESSION_REPOSITORY, HASH_PROVIDER } from "../../domain/tokens";
import { changeOwnPasswordInputSchema, type ChangeOwnPasswordInput } from "./auth.schemas";
import type { IAuthSessionRepository } from "../../domain/auth/auth-session.repository";
import type { IHashProvider } from "../../domain/auth/ihash-provider";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { UnauthorizedException } from "../../domain/exceptions/unauthorized.exception";

@Injectable()
export class ChangeOwnPasswordUseCase {
  public constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: IAuthSessionRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
  ) {}

  public async execute(input: {
    userId: string;
    currentSessionId: string;
    payload: ChangeOwnPasswordInput;
  }): Promise<{ success: true }> {
    const validated = changeOwnPasswordInputSchema.parse(input.payload);
    const currentUser = await this.authSessionRepository.findUserById(input.userId);

    if (currentUser === null || !currentUser.isActive || currentUser.passwordHash === null) {
      throw new UnauthorizedException("USER_NOT_FOUND", "Authenticated user not found");
    }

    const isCurrentPasswordValid = await this.hashProvider.compare(
      validated.currentPassword,
      currentUser.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new ForbiddenException("CURRENT_PASSWORD_INVALID", "Current password is invalid");
    }

    const isNewPasswordEqualCurrent = await this.hashProvider.compare(
      validated.newPassword,
      currentUser.passwordHash,
    );

    if (isNewPasswordEqualCurrent) {
      throw new ConflictException("PASSWORD_MUST_BE_DIFFERENT", "New password must be different from the current password");
    }

    const passwordHash = await this.hashProvider.hash(validated.newPassword);

    await this.authSessionRepository.updateCurrentUserPassword({
      userId: input.userId,
      passwordHash,
      passwordChangedAt: new Date(),
    });
    await this.authSessionRepository.revokeOtherSessionsByUserId({
      userId: input.userId,
      currentSessionId: input.currentSessionId,
    });

    return { success: true };
  }
}
