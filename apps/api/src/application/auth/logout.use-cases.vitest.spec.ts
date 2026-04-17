import { describe, expect, it, vi } from "vitest";
import { LogoutUseCase } from "./logout.use-case";
import { LogoutAllUseCase } from "./logout-all.use-case";
import { IJwtProvider } from "../../domain/auth/ijwt-provider";
import {
  AuthSession,
  AuthSessionWithUser,
  AuthUser,
  IAuthSessionRepository,
} from "../../domain/auth/auth-session.repository";
import type { AccessTokenPayload } from "../../domain/auth/auth.types";

function createRepositoryMock(): IAuthSessionRepository {
  return {
    findUserByEmail: vi.fn(async (): Promise<AuthUser | null> => null),
    findUserById: vi.fn(async (): Promise<AuthUser | null> => null),
    findCurrentUserById: vi.fn(async () => null),
    findSessionById: vi.fn(async (): Promise<AuthSessionWithUser | null> => null),
    updateCurrentUserProfile: vi.fn(async () => {
      throw new Error("not implemented");
    }),
    updateCurrentUserPassword: vi.fn(async () => undefined),
    createSession: vi.fn(async (input): Promise<AuthSession> => ({
      id: input.id,
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      expiresAt: input.expiresAt,
      revokedAt: null,
      lastUsedAt: null,
    })),
    revokeSessionById: vi.fn(async () => undefined),
    revokeAllSessionsByUserId: vi.fn(async () => undefined),
    revokeOtherSessionsByUserId: vi.fn(async () => undefined),
    incrementUserTokenVersion: vi.fn(async () => undefined),
  };
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

describe("Logout use cases", () => {
  it("logout revokes current session and remains idempotent", async () => {
    const jwtProvider: IJwtProvider = {
      sign: vi.fn(),
      verify: vi.fn(async () => createVerifiedPayload()),
      decode: vi.fn(),
    };

    const repository = createRepositoryMock();
    const useCase = new LogoutUseCase(jwtProvider, repository);

    await expect(useCase.execute({ accessToken: "access-token-1" })).resolves.toBeUndefined();
    await expect(useCase.execute({ accessToken: "access-token-1" })).resolves.toBeUndefined();

    expect(repository.revokeSessionById).toHaveBeenCalledTimes(2);
    expect(repository.revokeSessionById).toHaveBeenNthCalledWith(1, "session-1");
  });

  it("logout-all revokes all sessions and increments token version", async () => {
    const jwtProvider: IJwtProvider = {
      sign: vi.fn(),
      verify: vi.fn(async () => createVerifiedPayload()),
      decode: vi.fn(),
    };

    const repository = createRepositoryMock();
    const useCase = new LogoutAllUseCase(jwtProvider, repository);

    await expect(useCase.execute({ accessToken: "access-token-1" })).resolves.toBeUndefined();

    expect(repository.revokeAllSessionsByUserId).toHaveBeenCalledWith("user-1");
    expect(repository.incrementUserTokenVersion).toHaveBeenCalledWith("user-1");
  });
});
