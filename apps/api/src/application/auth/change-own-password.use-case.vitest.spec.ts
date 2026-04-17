import { describe, expect, it, vi } from "vitest";
import { ChangeOwnPasswordUseCase } from "./change-own-password.use-case";
import type {
  AuthSession,
  AuthSessionWithUser,
  AuthUser,
  IAuthSessionRepository,
} from "../../domain/auth/auth-session.repository";
import type { IHashProvider } from "../../domain/auth/ihash-provider";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";

function createUser(): AuthUser {
  return {
    id: "user-1",
    email: "user@example.com",
    name: "User",
    isActive: true,
    tokenVersion: 0,
    role: "MANAGER",
    passwordHash: "stored-hash",
  };
}

function createRepository(
  overrides?: Partial<IAuthSessionRepository>,
): IAuthSessionRepository {
  return {
    findUserByEmail: vi.fn(async () => null),
    findUserById: vi.fn(async () => createUser()),
    findCurrentUserById: vi.fn(async () => ({
      id: "user-1",
      email: "user@example.com",
      name: "User",
      isActive: true,
      tokenVersion: 0,
      role: "MANAGER" as const,
    })),
    findSessionById: vi.fn(async (): Promise<AuthSessionWithUser | null> => null),
    updateCurrentUserProfile: vi.fn(async () => {
      throw new Error("not implemented");
    }),
    updateCurrentUserPassword: vi.fn(async () => undefined),
    createSession: vi.fn(async (): Promise<AuthSession> => {
      throw new Error("not implemented");
    }),
    revokeSessionById: vi.fn(async () => undefined),
    revokeAllSessionsByUserId: vi.fn(async () => undefined),
    revokeOtherSessionsByUserId: vi.fn(async () => undefined),
    incrementUserTokenVersion: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("ChangeOwnPasswordUseCase", () => {
  it("updates password and revokes other sessions", async () => {
    const repository = createRepository();
    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "new-hash"),
      compare: vi
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
    };

    const useCase = new ChangeOwnPasswordUseCase(repository, hashProvider);
    const result = await useCase.execute({
      userId: "user-1",
      currentSessionId: "session-1",
      payload: {
        currentPassword: "current-password",
        newPassword: "new-password-123",
        confirmNewPassword: "new-password-123",
      },
    });

    expect(result).toEqual({ success: true });
    expect(repository.updateCurrentUserPassword).toHaveBeenCalled();
    expect(repository.revokeOtherSessionsByUserId).toHaveBeenCalledWith({
      userId: "user-1",
      currentSessionId: "session-1",
    });
  });

  it("throws when current password is invalid", async () => {
    const repository = createRepository();
    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "new-hash"),
      compare: vi.fn(async () => false),
    };

    const useCase = new ChangeOwnPasswordUseCase(repository, hashProvider);

    await expect(
      useCase.execute({
        userId: "user-1",
        currentSessionId: "session-1",
        payload: {
          currentPassword: "wrong",
          newPassword: "new-password-123",
          confirmNewPassword: "new-password-123",
        },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it("throws when new password matches current password", async () => {
    const repository = createRepository();
    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "new-hash"),
      compare: vi
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true),
    };

    const useCase = new ChangeOwnPasswordUseCase(repository, hashProvider);

    await expect(
      useCase.execute({
        userId: "user-1",
        currentSessionId: "session-1",
        payload: {
          currentPassword: "current-password",
          newPassword: "current-password",
          confirmNewPassword: "current-password",
        },
      }),
    ).rejects.toThrow(ConflictException);
  });
});
