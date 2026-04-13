import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiEnv } from "@repo/config";
import { AuthTokensResult, createTokenPayload } from "../../domain/auth/auth-tokens";
import { AUTH_SESSION_REPOSITORY, HASH_PROVIDER, JWT_PROVIDER, RATE_LIMIT_STORE } from "../../domain/tokens";
import { UnauthorizedException } from "../../domain/exceptions/unauthorized.exception";
import { refreshInputSchema, RefreshInput } from "./auth.schemas";
import { parseDurationToMs } from "../common/parse-duration";
import { randomUUID } from "crypto";
import { validateRateLimit } from "./auth.helpers";
import { AuthUseCaseDependencies } from "./auth.use-case.dependencies";
import type { IHashProvider } from "../../domain/auth/ihash-provider";
import type { IJwtProvider } from "../../domain/auth/ijwt-provider";
import type { IRateLimitStore } from "../../domain/rate-limit/irate-limit-store";
import type { IAuthSessionRepository } from "../../domain/auth/auth-session.repository";

type ApiConfigReader = Pick<ConfigService<ApiEnv, true>, "get">;

@Injectable()
export class RefreshSessionUseCase {
  private readonly deps: AuthUseCaseDependencies;

  public constructor(
    @Inject(JWT_PROVIDER) jwtProvider: IJwtProvider,
    @Inject(HASH_PROVIDER) hashProvider: IHashProvider,
    @Inject(RATE_LIMIT_STORE) rateLimitStore: IRateLimitStore,
    @Inject(AUTH_SESSION_REPOSITORY) authSessionRepository: IAuthSessionRepository,
    @Inject(ConfigService) private readonly configService: ApiConfigReader,
  ) {
    this.deps = {
      jwtProvider,
      hashProvider,
      rateLimitStore,
      authSessionRepository,
      jwtIssuer: this.configService.get("JWT_ISSUER", { infer: true }),
      jwtAudience: this.configService.get("JWT_AUDIENCE", { infer: true }),
      accessTokenExpiresIn: this.configService.get("JWT_ACCESS_TOKEN_EXPIRES_IN", { infer: true }),
      refreshTokenExpiresIn: this.configService.get("JWT_REFRESH_TOKEN_EXPIRES_IN", { infer: true }),
    };
  }

  public async execute(rawInput: RefreshInput): Promise<AuthTokensResult> {
    const input = refreshInputSchema.parse(rawInput);
    const rateLimitKey = `auth:refresh:${input.ipAddress ?? "unknown"}`;
    await validateRateLimit(this.deps, rateLimitKey, 10);

    const payload = await this.deps.jwtProvider.verify(input.refreshToken);
    const currentSession = await this.deps.authSessionRepository.findSessionById(payload.sessionId);

    if (currentSession === null) {
      throw new UnauthorizedException("REFRESH_TOKEN_INVALID", "Invalid refresh token");
    }

    const isRefreshTokenValid = await this.deps.hashProvider.compare(
      input.refreshToken,
      currentSession.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException("REFRESH_TOKEN_INVALID", "Invalid refresh token");
    }

    if (currentSession.revokedAt !== null) {
      await this.deps.authSessionRepository.revokeAllSessionsByUserId(currentSession.userId);
      await this.deps.authSessionRepository.incrementUserTokenVersion(currentSession.userId);
      throw new UnauthorizedException(
        "REFRESH_TOKEN_REUSE_DETECTED",
        "Refresh token reuse detected",
      );
    }

    if (currentSession.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException("REFRESH_TOKEN_INVALID", "Refresh token expired");
    }

    if (!currentSession.user.isActive) {
      throw new UnauthorizedException("USER_INACTIVE", "User inactive");
    }

    if (currentSession.user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException("TOKEN_VERSION_MISMATCH", "Token version mismatch");
    }

    const newSessionId = randomUUID();
    const newPayload = createTokenPayload({
      userId: currentSession.user.id,
      sessionId: newSessionId,
      tokenVersion: currentSession.user.tokenVersion,
      role: currentSession.user.role,
      issuer: this.deps.jwtIssuer,
      audience: this.deps.jwtAudience,
    });

    const accessToken = await this.deps.jwtProvider.sign(
      newPayload,
      this.deps.accessTokenExpiresIn,
    );
    const refreshToken = await this.deps.jwtProvider.sign(
      newPayload,
      this.deps.refreshTokenExpiresIn,
    );
    const refreshTokenHash = await this.deps.hashProvider.hash(refreshToken);
    const refreshTokenTtlMs = parseDurationToMs(this.deps.refreshTokenExpiresIn);

    await this.deps.authSessionRepository.revokeSessionById(currentSession.id);
    await this.deps.authSessionRepository.createSession({
      id: newSessionId,
      userId: currentSession.user.id,
      refreshTokenHash,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt: new Date(Date.now() + refreshTokenTtlMs),
    });

    return {
      accessToken,
      refreshToken,
      sessionId: newSessionId,
      user: {
        id: currentSession.user.id,
        email: currentSession.user.email,
        name: currentSession.user.name,
        role: currentSession.user.role,
      },
    };
  }
}
