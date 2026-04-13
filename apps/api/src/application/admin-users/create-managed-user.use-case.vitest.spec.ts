import { describe, expect, it, vi } from "vitest";
import { CreateManagedUserUseCase } from "./create-managed-user.use-case";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import type { IHashProvider } from "../../domain/auth/ihash-provider";
import type {
  IAdminUserRepository,
  ListManagedUsersQuery,
  ManagedUserEntity,
  PaginatedManagedUsers,
  UpdateManagedUserInput,
} from "../../domain/admin-users/admin-user.types";

function managedUser(email = "new@example.com"): ManagedUserEntity {
  return {
    id: "user-1",
    name: "New User",
    email,
    isActive: true,
    role: "MANAGER",
    createdAt: "2026-04-06T10:00:00.000Z",
    updatedAt: "2026-04-06T10:00:00.000Z",
  };
}

function createMockRepository(): IAdminUserRepository {
  return {
    createUser: vi.fn(async () => managedUser()),
    findUserById: vi.fn(async () => null),
    findUserByEmail: vi.fn(async () => null),
    listUsers: vi.fn(async (_query: ListManagedUsersQuery): Promise<PaginatedManagedUsers> => ({
      data: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    })),
    updateUser: vi.fn(async (_id: string, _input: UpdateManagedUserInput) => managedUser()),
    deactivateUser: vi.fn(async () => undefined),
    revokeAllSessionsByUserId: vi.fn(async () => undefined),
    incrementUserTokenVersion: vi.fn(async () => undefined),
  };
}

describe("CreateManagedUserUseCase", () => {
  it("creates user with hashed password", async () => {
    const repository = createMockRepository();
    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "hashed-password"),
      compare: vi.fn(async () => true),
    };

    const useCase = new CreateManagedUserUseCase(repository, hashProvider);

    const result = await useCase.execute({
      name: "New User",
      email: "new@example.com",
      password: "12345678",
      role: "MANAGER",
    });

    expect(result.email).toBe("new@example.com");
    expect(hashProvider.hash).toHaveBeenCalledWith("12345678");
    expect(repository.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@example.com",
        passwordHash: "hashed-password",
      }),
    );
  });

  it("throws conflict when email already exists", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findUserByEmail).mockResolvedValue(managedUser("taken@example.com"));

    const hashProvider: IHashProvider = {
      hash: vi.fn(async () => "hashed-password"),
      compare: vi.fn(async () => true),
    };

    const useCase = new CreateManagedUserUseCase(repository, hashProvider);

    await expect(
      useCase.execute({
        name: "Taken",
        email: "taken@example.com",
        password: "12345678",
        role: "ADMIN",
      }),
    ).rejects.toThrow(ConflictException);

    expect(repository.createUser).not.toHaveBeenCalled();
  });
});
