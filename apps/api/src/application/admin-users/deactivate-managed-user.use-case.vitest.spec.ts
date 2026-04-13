import { describe, expect, it, vi } from "vitest";
import { DeactivateManagedUserUseCase } from "./deactivate-managed-user.use-case";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type {
  IAdminUserRepository,
  ListManagedUsersQuery,
  ManagedUserEntity,
  PaginatedManagedUsers,
  UpdateManagedUserInput,
} from "../../domain/admin-users/admin-user.types";

function managedUser(id = "target-user"): ManagedUserEntity {
  return {
    id,
    name: "Target User",
    email: "target@example.com",
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
    updateUser: vi.fn(async (_id: string, _input: UpdateManagedUserInput) => managedUser()),
    deactivateUser: vi.fn(async () => undefined),
    revokeAllSessionsByUserId: vi.fn(async () => undefined),
    incrementUserTokenVersion: vi.fn(async () => undefined),
  };
}

describe("DeactivateManagedUserUseCase", () => {
  it("blocks self deactivation", async () => {
    const repository = createMockRepository();
    const useCase = new DeactivateManagedUserUseCase(repository);

    await expect(
      useCase.execute({
        actorUserId: "same-user",
        targetUserId: "same-user",
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it("throws not found for missing target", async () => {
    const repository = createMockRepository();
    vi.mocked(repository.findUserById).mockResolvedValue(null);
    const useCase = new DeactivateManagedUserUseCase(repository);

    await expect(
      useCase.execute({
        actorUserId: "admin-user",
        targetUserId: "missing-user",
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("deactivates user and revokes sessions", async () => {
    const repository = createMockRepository();
    const useCase = new DeactivateManagedUserUseCase(repository);

    await expect(
      useCase.execute({
        actorUserId: "admin-user",
        targetUserId: "target-user",
      }),
    ).resolves.toBeUndefined();

    expect(repository.deactivateUser).toHaveBeenCalledWith("target-user");
    expect(repository.revokeAllSessionsByUserId).toHaveBeenCalledWith("target-user");
    expect(repository.incrementUserTokenVersion).toHaveBeenCalledWith("target-user");
  });
});
