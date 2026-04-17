import { Inject, Injectable } from "@nestjs/common";
import { AUTH_SESSION_REPOSITORY, HASH_PROVIDER } from "../../domain/tokens";
import { updateOwnProfileInputSchema, type UpdateOwnProfileInput } from "./auth.schemas";
import type { IAuthSessionRepository } from "../../domain/auth/auth-session.repository";
import type { IHashProvider } from "../../domain/auth/ihash-provider";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { UnauthorizedException } from "../../domain/exceptions/unauthorized.exception";
import type { OwnAccountProfile } from "./get-own-account-profile.use-case";

@Injectable()
export class UpdateOwnProfileUseCase {
  public constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: IAuthSessionRepository,
    @Inject(HASH_PROVIDER)
    private readonly hashProvider: IHashProvider,
  ) {}

  public async execute(userId: string, rawInput: UpdateOwnProfileInput): Promise<OwnAccountProfile> {
    const input = updateOwnProfileInputSchema.parse(rawInput);
    const currentUser = await this.authSessionRepository.findUserById(userId);

    if (currentUser === null || !currentUser.isActive || currentUser.passwordHash === null) {
      throw new UnauthorizedException("USER_NOT_FOUND", "Authenticated user not found");
    }

    const isPasswordValid = await this.hashProvider.compare(
      input.currentPassword,
      currentUser.passwordHash,
    );

    if (!isPasswordValid) {
      throw new ForbiddenException("CURRENT_PASSWORD_INVALID", "Current password is invalid");
    }

    if (input.email !== currentUser.email) {
      const userWithEmail = await this.authSessionRepository.findUserByEmail(input.email);

      if (userWithEmail !== null && userWithEmail.id !== currentUser.id) {
        throw new ConflictException("USER_EMAIL_ALREADY_EXISTS", "User email already exists");
      }
    }

    const updatedUser = await this.authSessionRepository.updateCurrentUserProfile({
      userId,
      name: input.name,
      email: input.email,
    });

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
    };
  }
}
