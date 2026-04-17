import { describe, expect, it, vi } from "vitest";
import { ConfigService } from "@nestjs/config";
import { ApiEnv } from "@repo/config";
import { RefreshSessionUseCase } from "./refresh-session.use-case";
import { IJwtProvider } from "../../domain/auth/ijwt-provider";
import { IHashProvider } from "../../domain/auth/ihash-provider";
import { IRateLimitStore } from "../../domain/rate-limit/irate-limit-store";
import {
  AuthSession,
  AuthSessionWithUser,
  IAuthSessionRepository,
} from "../../domain/auth/auth-session.repository";
import { UnauthorizedException } from "../../domain/exceptions/unauthorized.exception";
import type { AccessTokenPayload } from "../../domain/auth/auth.types";

type ConfigReader = Pick<ConfigService<ApiEnv, true>, "get">;

function createConfigReader(
  overrides: Partial<Pick<ApiEnv, "AUTH_CHECK_IP_ON_REFRESH">> = {},
): ConfigReader {
  const env: Pick<
    ApiEnv,
    | "JWT_ISSUER"
    | "JWT_AUDIENCE"
    | "JWT_ACCESS_TOKEN_EXPIRES_IN"
    | "JWT_REFRESH_TOKEN_EXPIRES_IN"
    | "AUTH_CHECK_IP_ON_REFRESH"
  > = {
    JWT_ISSUER: "issuer-test",
    JWT_AUDIENCE: "audience-test",
    JWT_ACCESS_TOKEN_EXPIRES_IN: "15m",
    JWT_REFRESH_TOKEN_EXPIRES_IN: "7d",
    AUTH_CHECK_IP_ON_REFRESH: false,
    ...overrides,
  };

  return {
    get: (key: keyof ApiEnv) =>
      env[key as keyof typeof env] as ApiEnv[keyof ApiEnv],
  } as ConfigReader;
}

function createVerifiedPayload(): AccessTokenPayload {
  return {
    sub: "user-1",
    sessionId: "session-1",
    tokenVersion: 0,
    role: "ADMIN",
    iss: "issuer-test",
    aud: "audience-test",
  };
}

function createActiveSession(): AuthSessionWithUser {
  return {
    id: "session-1",
    userId: "user-1",
    refreshTokenHash: "stored-hash",
    userAgent: "Vitest",
    ipAddress: "127.0.0.1",
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    lastUsedAt: null,
    user: {
      id: "user-1",
      email: "admin@example.com",
      name: "Admin",
      isActive: true,
      tokenVersion: 0,
      role: "ADMIN",
    },
  };
}

describe("RefreshSessionUseCase", () => {
  it("rotates session and issues new token pair", async () => {
    const jwtProvider: IJwtProvider = {
      sign: vi.fn(async (_payload, expiresIn) => `token-${expiresIn ?? "default"}`),
      verify: vi.fn(async () => createVerifiedPayload()),
      decode: vi.fn(),
    };

    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "new-refresh-hash"),
      compare: vi.fn(async () => true),
    };

    const rateLimitStore: IRateLimitStore = {
      increment: vi.fn(async () => 1),
      reset: vi.fn(async () => undefined),
    };

    const authSessionRepository: IAuthSessionRepository = {
      findUserByEmail: vi.fn(),
      findUserById: vi.fn(async () => null),
      findCurrentUserById: vi.fn(async () => null),
      findSessionById: vi.fn(async () => createActiveSession()),
      updateCurrentUserProfile: vi.fn(async () => {
        throw new Error("not implemented");
      }),
      updateCurrentUserPassword: vi.fn(async () => undefined),
      createSession: vi.fn(
        async (input): Promise<AuthSession> => ({
          id: input.id,
          userId: input.userId,
          refreshTokenHash: input.refreshTokenHash,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
          expiresAt: input.expiresAt,
          revokedAt: null,
          lastUsedAt: null,
        }),
      ),
      revokeSessionById: vi.fn(async () => undefined),
      revokeAllSessionsByUserId: vi.fn(async () => undefined),
      revokeOtherSessionsByUserId: vi.fn(async () => undefined),
      incrementUserTokenVersion: vi.fn(async () => undefined),
    };

    const useCase = new RefreshSessionUseCase(
      jwtProvider,
      hashProvider,
      rateLimitStore,
      authSessionRepository,
      createConfigReader(),
    );

    const result = await useCase.execute({
      refreshToken: "refresh-token-1",
      ipAddress: "127.0.0.1",
      userAgent: "Vitest",
    });

    expect(result.accessToken).toBe("token-15m");
    expect(result.refreshToken).toBe("token-7d");
    expect(result.user.id).toBe("user-1");
    expect(authSessionRepository.revokeSessionById).toHaveBeenCalledWith("session-1");
    expect(authSessionRepository.createSession).toHaveBeenCalledTimes(1);
  });

  it("detects refresh token reuse for revoked sessions", async () => {
    const jwtProvider: IJwtProvider = {
      sign: vi.fn(),
      verify: vi.fn(async () => createVerifiedPayload()),
      decode: vi.fn(),
    };

    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "hash"),
      compare: vi.fn(async () => true),
    };

    const rateLimitStore: IRateLimitStore = {
      increment: vi.fn(async () => 1),
      reset: vi.fn(async () => undefined),
    };

    const revokedSession = createActiveSession();
    revokedSession.revokedAt = new Date();

    const authSessionRepository: IAuthSessionRepository = {
      findUserByEmail: vi.fn(),
      findUserById: vi.fn(async () => null),
      findCurrentUserById: vi.fn(async () => null),
      findSessionById: vi.fn(async () => revokedSession),
      updateCurrentUserProfile: vi.fn(async () => {
        throw new Error("not implemented");
      }),
      updateCurrentUserPassword: vi.fn(async () => undefined),
      createSession: vi.fn(),
      revokeSessionById: vi.fn(async () => undefined),
      revokeAllSessionsByUserId: vi.fn(async () => undefined),
      revokeOtherSessionsByUserId: vi.fn(async () => undefined),
      incrementUserTokenVersion: vi.fn(async () => undefined),
    };

    const useCase = new RefreshSessionUseCase(
      jwtProvider,
      hashProvider,
      rateLimitStore,
      authSessionRepository,
      createConfigReader(),
    );

    await expect(
      useCase.execute({
        refreshToken: "refresh-token-1",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toMatchObject({
      code: "REFRESH_TOKEN_REUSE_DETECTED",
    } satisfies Partial<UnauthorizedException>);

    expect(authSessionRepository.revokeAllSessionsByUserId).toHaveBeenCalledWith("user-1");
    expect(authSessionRepository.incrementUserTokenVersion).toHaveBeenCalledWith("user-1");
  });

  it("blocks refresh when IP changes and AUTH_CHECK_IP_ON_REFRESH is enabled", async () => {
    const jwtProvider: IJwtProvider = {
      sign: vi.fn(),
      verify: vi.fn(async () => createVerifiedPayload()),
      decode: vi.fn(),
    };

    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "hash"),
      compare: vi.fn(async () => true),
    };

    const rateLimitStore: IRateLimitStore = {
      increment: vi.fn(async () => 1),
      reset: vi.fn(async () => undefined),
    };

    const authSessionRepository: IAuthSessionRepository = {
      findUserByEmail: vi.fn(),
      findUserById: vi.fn(async () => null),
      findCurrentUserById: vi.fn(async () => null),
      findSessionById: vi.fn(async () => createActiveSession()),
      updateCurrentUserProfile: vi.fn(async () => {
        throw new Error("not implemented");
      }),
      updateCurrentUserPassword: vi.fn(async () => undefined),
      createSession: vi.fn(),
      revokeSessionById: vi.fn(async () => undefined),
      revokeAllSessionsByUserId: vi.fn(async () => undefined),
      revokeOtherSessionsByUserId: vi.fn(async () => undefined),
      incrementUserTokenVersion: vi.fn(async () => undefined),
    };

    const useCase = new RefreshSessionUseCase(
      jwtProvider,
      hashProvider,
      rateLimitStore,
      authSessionRepository,
      createConfigReader({ AUTH_CHECK_IP_ON_REFRESH: true }),
    );

    await expect(
      useCase.execute({
        refreshToken: "refresh-token-1",
        ipAddress: "127.0.0.2",
        userAgent: "Vitest",
      }),
    ).rejects.toMatchObject({
      code: "SESSION_CONTEXT_MISMATCH",
    } satisfies Partial<UnauthorizedException>);

    expect(authSessionRepository.revokeSessionById).not.toHaveBeenCalled();
    expect(authSessionRepository.createSession).not.toHaveBeenCalled();
  });

  it("allows refresh when IP matches and AUTH_CHECK_IP_ON_REFRESH is enabled", async () => {
    const jwtProvider: IJwtProvider = {
      sign: vi.fn(async (_payload, expiresIn) => `token-${expiresIn ?? "default"}`),
      verify: vi.fn(async () => createVerifiedPayload()),
      decode: vi.fn(),
    };

    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "new-refresh-hash"),
      compare: vi.fn(async () => true),
    };

    const rateLimitStore: IRateLimitStore = {
      increment: vi.fn(async () => 1),
      reset: vi.fn(async () => undefined),
    };

    const authSessionRepository: IAuthSessionRepository = {
      findUserByEmail: vi.fn(),
      findUserById: vi.fn(async () => null),
      findCurrentUserById: vi.fn(async () => null),
      findSessionById: vi.fn(async () => createActiveSession()),
      updateCurrentUserProfile: vi.fn(async () => {
        throw new Error("not implemented");
      }),
      updateCurrentUserPassword: vi.fn(async () => undefined),
      createSession: vi.fn(
        async (input): Promise<AuthSession> => ({
          id: input.id,
          userId: input.userId,
          refreshTokenHash: input.refreshTokenHash,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
          expiresAt: input.expiresAt,
          revokedAt: null,
          lastUsedAt: null,
        }),
      ),
      revokeSessionById: vi.fn(async () => undefined),
      revokeAllSessionsByUserId: vi.fn(async () => undefined),
      revokeOtherSessionsByUserId: vi.fn(async () => undefined),
      incrementUserTokenVersion: vi.fn(async () => undefined),
    };

    const useCase = new RefreshSessionUseCase(
      jwtProvider,
      hashProvider,
      rateLimitStore,
      authSessionRepository,
      createConfigReader({ AUTH_CHECK_IP_ON_REFRESH: true }),
    );

    const result = await useCase.execute({
      refreshToken: "refresh-token-1",
      ipAddress: "127.0.0.1",
      userAgent: "Vitest",
    });

    expect(result.accessToken).toBe("token-15m");
    expect(result.refreshToken).toBe("token-7d");
    expect(authSessionRepository.revokeSessionById).toHaveBeenCalledWith("session-1");
    expect(authSessionRepository.createSession).toHaveBeenCalledTimes(1);
  });
});
