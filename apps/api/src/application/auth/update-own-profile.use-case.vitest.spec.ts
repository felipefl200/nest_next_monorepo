import { describe, expect, it, vi } from "vitest";
import { UpdateOwnProfileUseCase } from "./update-own-profile.use-case";
import type {
  AuthSession,
  AuthSessionWithUser,
  AuthUser,
  IAuthSessionRepository,
} from "../../domain/auth/auth-session.repository";
import type { IHashProvider } from "../../domain/auth/ihash-provider";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";

function createUser(overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: "user-1",
    email: "user@example.com",
    name: "User",
    isActive: true,
    tokenVersion: 0,
    role: "MANAGER",
    passwordHash: "stored-hash",
    ...overrides,
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
    updateCurrentUserProfile: vi.fn(async ({ email, name }) => ({
      id: "user-1",
      email,
      name,
      isActive: true,
      tokenVersion: 0,
      role: "MANAGER" as const,
    })),
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

describe("UpdateOwnProfileUseCase", () => {
  it("updates own profile when current password is valid", async () => {
    const repository = createRepository();
    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "unused"),
      compare: vi.fn(async () => true),
    };

    const useCase = new UpdateOwnProfileUseCase(repository, hashProvider);
    const result = await useCase.execute("user-1", {
      name: "Updated User",
      email: "updated@example.com",
      currentPassword: "secret",
    });

    expect(result).toEqual({
      id: "user-1",
      name: "Updated User",
      email: "updated@example.com",
      role: "MANAGER",
      isActive: true,
    });
    expect(repository.updateCurrentUserProfile).toHaveBeenCalledWith({
      userId: "user-1",
      name: "Updated User",
      email: "updated@example.com",
    });
  });

  it("throws when current password is invalid", async () => {
    const repository = createRepository();
    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "unused"),
      compare: vi.fn(async () => false),
    };

    const useCase = new UpdateOwnProfileUseCase(repository, hashProvider);

    await expect(
      useCase.execute("user-1", {
        name: "Updated User",
        email: "updated@example.com",
        currentPassword: "wrong",
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it("throws when email already exists", async () => {
    const repository = createRepository({
      findUserByEmail: vi.fn(async () => createUser({ id: "user-2", email: "updated@example.com" })),
    });
    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "unused"),
      compare: vi.fn(async () => true),
    };

    const useCase = new UpdateOwnProfileUseCase(repository, hashProvider);

    await expect(
      useCase.execute("user-1", {
        name: "Updated User",
        email: "updated@example.com",
        currentPassword: "secret",
      }),
    ).rejects.toThrow(ConflictException);
  });
});
