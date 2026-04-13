import { Inject, Injectable } from "@nestjs/common";
import { AUTH_SESSION_REPOSITORY, JWT_PROVIDER } from "../../domain/tokens";
import { LogoutAllInput, logoutAllInputSchema } from "./auth.schemas";
import type { IJwtProvider } from "../../domain/auth/ijwt-provider";
import type { IAuthSessionRepository } from "../../domain/auth/auth-session.repository";

@Injectable()
export class LogoutAllUseCase {
  public constructor(
    @Inject(JWT_PROVIDER) private readonly jwtProvider: IJwtProvider,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: IAuthSessionRepository,
  ) {}

  public async execute(rawInput: LogoutAllInput): Promise<void> {
    const input = logoutAllInputSchema.parse(rawInput);
    const payload = await this.jwtProvider.verify(input.accessToken);

    await this.authSessionRepository.revokeAllSessionsByUserId(payload.sub);
    await this.authSessionRepository.incrementUserTokenVersion(payload.sub);
  }
}
