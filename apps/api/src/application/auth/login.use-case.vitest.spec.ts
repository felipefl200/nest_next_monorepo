import { describe, expect, it, vi } from "vitest";
import { ConfigService } from "@nestjs/config";
import { ApiEnv } from "@repo/config";
import { LoginUseCase } from "./login.use-case";
import { IJwtProvider } from "../../domain/auth/ijwt-provider";
import { IHashProvider } from "../../domain/auth/ihash-provider";
import { IRateLimitStore } from "../../domain/rate-limit/irate-limit-store";
import {
  AuthSession,
  AuthSessionWithUser,
  AuthUser,
  IAuthSessionRepository,
} from "../../domain/auth/auth-session.repository";
import { UnauthorizedException } from "../../domain/exceptions/unauthorized.exception";

type ConfigReader = Pick<ConfigService<ApiEnv, true>, "get">;

function createConfigReader(): ConfigReader {
  const env: Pick<
    ApiEnv,
    | "JWT_ISSUER"
    | "JWT_AUDIENCE"
    | "JWT_ACCESS_TOKEN_EXPIRES_IN"
    | "JWT_REFRESH_TOKEN_EXPIRES_IN"
  > = {
    JWT_ISSUER: "issuer-test",
    JWT_AUDIENCE: "audience-test",
    JWT_ACCESS_TOKEN_EXPIRES_IN: "15m",
    JWT_REFRESH_TOKEN_EXPIRES_IN: "7d",
  };

  return {
    get: (key: keyof ApiEnv) =>
      env[key as keyof typeof env] as ApiEnv[keyof ApiEnv],
  } as ConfigReader;
}

function createUser(): AuthUser {
  return {
    id: "user-1",
    email: "admin@example.com",
    name: "Admin",
    isActive: true,
    tokenVersion: 0,
    role: "ADMIN",
    passwordHash: "hash-123",
  };
}

describe("LoginUseCase", () => {
  it("returns access/refresh tokens on valid credentials", async () => {
    const jwtProvider: IJwtProvider = {
      sign: vi.fn(async (_payload, expiresIn) => `token-${expiresIn ?? "default"}`),
      verify: vi.fn(),
      decode: vi.fn(),
    };

    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "refresh-hash"),
      compare: vi.fn(async () => true),
    };

    const rateLimitStore: IRateLimitStore = {
      increment: vi.fn(async () => 1),
      reset: vi.fn(async () => undefined),
    };

    const authSessionRepository: IAuthSessionRepository = {
      findUserByEmail: vi.fn(async () => createUser()),
      findUserById: vi.fn(async () => createUser()),
      findCurrentUserById: vi.fn(async () => null),
      findSessionById: vi.fn(async (): Promise<AuthSessionWithUser | null> => null),
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

    const useCase = new LoginUseCase(
      jwtProvider,
      hashProvider,
      rateLimitStore,
      authSessionRepository,
      createConfigReader(),
    );

    const result = await useCase.execute({
      email: "admin@example.com",
      password: "secret",
      ipAddress: "127.0.0.1",
      userAgent: "Vitest",
    });

    expect(result.user.email).toBe("admin@example.com");
    expect(result.accessToken).toBe("token-15m");
    expect(result.refreshToken).toBe("token-7d");
    expect(rateLimitStore.increment).toHaveBeenCalledWith("auth:login:127.0.0.1", 60);
    expect(authSessionRepository.createSession).toHaveBeenCalledTimes(1);
  });

  it("throws INVALID_CREDENTIALS for wrong password", async () => {
    const jwtProvider: IJwtProvider = {
      sign: vi.fn(),
      verify: vi.fn(),
      decode: vi.fn(),
    };

    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "hash"),
      compare: vi.fn(async () => false),
    };

    const rateLimitStore: IRateLimitStore = {
      increment: vi.fn(async () => 1),
      reset: vi.fn(async () => undefined),
    };

    const authSessionRepository: IAuthSessionRepository = {
      findUserByEmail: vi.fn(async () => createUser()),
      findUserById: vi.fn(async () => createUser()),
      findCurrentUserById: vi.fn(async () => null),
      findSessionById: vi.fn(async (): Promise<AuthSessionWithUser | null> => null),
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

    const useCase = new LoginUseCase(
      jwtProvider,
      hashProvider,
      rateLimitStore,
      authSessionRepository,
      createConfigReader(),
    );

    await expect(
      useCase.execute({
        email: "admin@example.com",
        password: "invalid",
        ipAddress: "127.0.0.1",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
    } satisfies Partial<UnauthorizedException>);
  });
});
