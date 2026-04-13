import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiEnv } from "@repo/config";
import { loginInputSchema, LoginInput } from "./auth.schemas";
import { AuthTokensResult } from "../../domain/auth/auth-tokens";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { UnauthorizedException } from "../../domain/exceptions/unauthorized.exception";
import { HASH_PROVIDER, JWT_PROVIDER, RATE_LIMIT_STORE, AUTH_SESSION_REPOSITORY } from "../../domain/tokens";
import { Inject } from "@nestjs/common";
import { issueAuthTokens, validateRateLimit } from "./auth.helpers";
import { AuthUseCaseDependencies } from "./auth.use-case.dependencies";
import type { IJwtProvider } from "../../domain/auth/ijwt-provider";
import type { IHashProvider } from "../../domain/auth/ihash-provider";
import type { IRateLimitStore } from "../../domain/rate-limit/irate-limit-store";
import type { IAuthSessionRepository } from "../../domain/auth/auth-session.repository";

type ApiConfigReader = Pick<ConfigService<ApiEnv, true>, "get">;

@Injectable()
export class LoginUseCase {
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

  public async execute(rawInput: LoginInput): Promise<AuthTokensResult> {
    const input = loginInputSchema.parse(rawInput);
    const rateLimitKey = `auth:login:${input.ipAddress ?? "unknown"}`;
    await validateRateLimit(this.deps, rateLimitKey, 5);

    const user = await this.deps.authSessionRepository.findUserByEmail(input.email);

    if (user === null || user.passwordHash === null) {
      throw new UnauthorizedException("INVALID_CREDENTIALS", "Invalid credentials");
    }

    if (!user.isActive) {
      throw new ForbiddenException("USER_INACTIVE", "User inactive");
    }

    const isPasswordValid = await this.deps.hashProvider.compare(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("INVALID_CREDENTIALS", "Invalid credentials");
    }

    return issueAuthTokens(this.deps, {
      user,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
    });
  }
}
