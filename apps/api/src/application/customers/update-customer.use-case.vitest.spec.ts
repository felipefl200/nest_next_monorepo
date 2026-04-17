import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpdateCustomerUseCase } from "./update-customer.use-case";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type {
  CreateCustomerInput,
  CustomerEntity,
  ICustomerRepository,
  ListCustomersQuery,
  PaginatedResult,
  UpdateCustomerInput,
} from "../../domain/customers/customer.types";

const ACTOR = {
  actorUserId: "user-1",
  actorRole: "MANAGER" as const,
};

function createCustomerEntity(id: string, email: string): CustomerEntity {
  return {
    id,
    name: "John",
    email,
    phone: "+55 11 99999-9999",
    taxId: "12345678900",
    ownerUserId: ACTOR.actorUserId,
    createdAt: "2026-04-06T10:00:00.000Z",
    updatedAt: "2026-04-06T10:00:00.000Z",
  };
}

function createMockRepository(): ICustomerRepository {
  return {
    create: vi.fn(async (input: CreateCustomerInput) => createCustomerEntity("customer-new", input.email)),
    findById: vi.fn(async () => null),
    findOwnedById: vi.fn(async () => null),
    findByEmail: vi.fn(async () => null),
    findByTaxId: vi.fn(async () => null),
    list: vi.fn(async (_query: ListCustomersQuery): Promise<PaginatedResult<CustomerEntity>> => ({
      data: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    })),
    update: vi.fn(async (id: string, input: UpdateCustomerInput) =>
      createCustomerEntity(id, input.email ?? "john@example.com"),
    ),
    delete: vi.fn(async () => undefined),
    countOrdersByCustomerId: vi.fn(async () => 0),
  };
}

describe("UpdateCustomerUseCase", () => {
  let repository: ICustomerRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it("updates customer when data is valid", async () => {
    vi.mocked(repository.findOwnedById).mockResolvedValue(createCustomerEntity("customer-1", "john@example.com"));

    const useCase = new UpdateCustomerUseCase(repository);
    const result = await useCase.execute("customer-1", { name: "John Updated" }, ACTOR);

    expect(result.id).toBe("customer-1");
    expect(repository.update).toHaveBeenCalledWith("customer-1", { name: "John Updated" });
  });

  it("throws not found when customer does not exist", async () => {
    const useCase = new UpdateCustomerUseCase(repository);

    await expect(useCase.execute("missing", { name: "X" }, ACTOR)).rejects.toThrow(NotFoundException);
  });

  it("throws conflict when email already belongs to another customer", async () => {
    vi.mocked(repository.findOwnedById).mockResolvedValue(createCustomerEntity("customer-1", "john@example.com"));
    vi.mocked(repository.findByEmail).mockResolvedValue(createCustomerEntity("customer-2", "taken@example.com"));

    const useCase = new UpdateCustomerUseCase(repository);

    await expect(
      useCase.execute("customer-1", { email: "taken@example.com" }, ACTOR),
    ).rejects.toThrow(ConflictException);

    expect(repository.update).not.toHaveBeenCalled();
  });

  it("throws conflict when taxId already belongs to another customer", async () => {
    vi.mocked(repository.findOwnedById).mockResolvedValue(createCustomerEntity("customer-1", "john@example.com"));
    vi.mocked(repository.findByTaxId).mockResolvedValue(createCustomerEntity("customer-2", "other@example.com"));

    const useCase = new UpdateCustomerUseCase(repository);

    await expect(
      useCase.execute("customer-1", { taxId: "99999999999" }, ACTOR),
    ).rejects.toThrow(ConflictException);
  });

  it("throws forbidden when manager tries to edit another user's customer", async () => {
    vi.mocked(repository.findOwnedById).mockResolvedValue(null);
    vi.mocked(repository.findById).mockResolvedValue(createCustomerEntity("customer-1", "john@example.com"));

    const useCase = new UpdateCustomerUseCase(repository);

    await expect(
      useCase.execute("customer-1", { name: "Forbidden" }, ACTOR),
    ).rejects.toThrow(ForbiddenException);
  });
});
