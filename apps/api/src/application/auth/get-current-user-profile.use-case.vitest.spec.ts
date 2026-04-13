import { describe, expect, it, vi } from "vitest";
import { GetCurrentUserProfileUseCase } from "./get-current-user-profile.use-case";
import type {
  AuthSession,
  AuthSessionWithUser,
  AuthUser,
  IAuthSessionRepository,
} from "../../domain/auth/auth-session.repository";

function createRepository(
  overrides?: Partial<IAuthSessionRepository>,
): IAuthSessionRepository {
  return {
    findUserByEmail: vi.fn(async (): Promise<AuthUser | null> => null),
    findCurrentUserById: vi.fn(async () => ({
      id: "user-1",
      email: "admin@example.com",
      name: "Admin",
      isActive: true,
      tokenVersion: 0,
      role: "ADMIN" as const,
    })),
    findSessionById: vi.fn(async (): Promise<AuthSessionWithUser | null> => null),
    createSession: vi.fn(async (): Promise<AuthSession> => {
      throw new Error("not implemented");
    }),
    revokeSessionById: vi.fn(async () => undefined),
    revokeAllSessionsByUserId: vi.fn(async () => undefined),
    incrementUserTokenVersion: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe("GetCurrentUserProfileUseCase", () => {
  it("returns the current user profile", async () => {
    const repository = createRepository();
    const useCase = new GetCurrentUserProfileUseCase(repository);

    await expect(useCase.execute("user-1")).resolves.toEqual({
      id: "user-1",
      email: "admin@example.com",
      name: "Admin",
      role: "ADMIN",
    });
  });

  it("throws when the user is missing", async () => {
    const repository = createRepository({
      findCurrentUserById: vi.fn(async () => null),
    });
    const useCase = new GetCurrentUserProfileUseCase(repository);

    await expect(useCase.execute("user-1")).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
    });
  });
});
