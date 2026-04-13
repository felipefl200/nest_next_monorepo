import { describe, expect, it, vi } from "vitest";
import { UpdateManagedUserUseCase } from "./update-managed-user.use-case";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type {
  IAdminUserRepository,
  ListManagedUsersQuery,
  ManagedUserEntity,
  PaginatedManagedUsers,
  UpdateManagedUserInput,
} from "../../domain/admin-users/admin-user.types";

function managedUser(id = "user-1", email = "u@example.com"): ManagedUserEntity {
  return {
    id,
    name: "User",
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
    findUserById: vi.fn(async () => managedUser()),
    findUserByEmail: vi.fn(async () => null),
    listUsers: vi.fn(async (_query: ListManagedUsersQuery): Promise<PaginatedManagedUsers> => ({
      data: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    })),
    updateUser: vi.fn(async (_id: string, input: UpdateManagedUserInput) =>
      managedUser("user-1", input.email ?? "u@example.com"),
    ),
    deactivateUser: vi.fn(async () => undefined),
    revokeAllSessionsByUserId: vi.fn(async () => undefined),
    incrementUserTokenVersion: vi.fn(async () => undefined),
  };
}

describe("UpdateManagedUserUseCase", () => {
  it("updates existing user", async () => {
    const repository = createMockRepository();
    const useCase = new UpdateManagedUserUseCase(repository);

    const result = await useCase.execute("user-1", { name: "Updated" });

    expect(result.id).toBe("user-1");
    expect(repository.updateUser).toHaveBeenCalledWith("user-1", { name: "Updated" });
  });

  it("throws not found when user does not exist", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findUserById).mockResolvedValue(null);
    const useCase = new UpdateManagedUserUseCase(repository);

    await expect(useCase.execute("missing", { name: "Updated" })).rejects.toThrow(NotFoundException);
  });

  it("throws conflict when updating to existing email", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findUserById).mockResolvedValue(managedUser("user-1", "old@example.com"));
    vi.mocked(repository.findUserByEmail).mockResolvedValue(managedUser("user-2", "used@example.com"));

    const useCase = new UpdateManagedUserUseCase(repository);

    await expect(
      useCase.execute("user-1", { email: "used@example.com" }),
    ).rejects.toThrow(ConflictException);
  });
});
