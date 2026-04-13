import { Inject, Injectable } from "@nestjs/common";
import { AUTH_SESSION_REPOSITORY, JWT_PROVIDER } from "../../domain/tokens";
import { LogoutInput, logoutInputSchema } from "./auth.schemas";
import type { IJwtProvider } from "../../domain/auth/ijwt-provider";
import type { IAuthSessionRepository } from "../../domain/auth/auth-session.repository";

@Injectable()
export class LogoutUseCase {
  public constructor(
    @Inject(JWT_PROVIDER) private readonly jwtProvider: IJwtProvider,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: IAuthSessionRepository,
  ) {}

  public async execute(rawInput: LogoutInput): Promise<void> {
    const input = logoutInputSchema.parse(rawInput);
    const payload = await this.jwtProvider.verify(input.accessToken);

    await this.authSessionRepository.revokeSessionById(payload.sessionId);
  }
}
