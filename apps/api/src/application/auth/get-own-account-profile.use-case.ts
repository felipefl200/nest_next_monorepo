import { Inject, Injectable } from "@nestjs/common";
import { AUTH_SESSION_REPOSITORY } from "../../domain/tokens";
import type { IAuthSessionRepository } from "../../domain/auth/auth-session.repository";
import { UnauthorizedException } from "../../domain/exceptions/unauthorized.exception";

export type OwnAccountProfile = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER";
  isActive: boolean;
};

@Injectable()
export class GetOwnAccountProfileUseCase {
  public constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: IAuthSessionRepository,
  ) {}

  public async execute(userId: string): Promise<OwnAccountProfile> {
    const user = await this.authSessionRepository.findCurrentUserById(userId);

    if (user === null || !user.isActive) {
      throw new UnauthorizedException("USER_NOT_FOUND", "Authenticated user not found");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
