import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpdateCustomerUseCase } from "./update-customer.use-case";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type {
  CreateCustomerInput,
  CustomerEntity,
  ICustomerRepository,
  ListCustomersQuery,
  PaginatedResult,
  UpdateCustomerInput,
} from "../../domain/customers/customer.types";

function createCustomerEntity(id: string, email: string): CustomerEntity {
  return {
    id,
    name: "John",
    email,
    phone: "+55 11 99999-9999",
    taxId: "12345678900",
    createdAt: "2026-04-06T10:00:00.000Z",
    updatedAt: "2026-04-06T10:00:00.000Z",
  };
}

function createMockRepository(): ICustomerRepository {
  return {
    create: vi.fn(async (input: CreateCustomerInput) => createCustomerEntity("customer-new", input.email)),
    findById: vi.fn(async () => null),
    findByEmail: vi.fn(async () => null),
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
    vi.mocked(repository.findById).mockResolvedValue(createCustomerEntity("customer-1", "john@example.com"));

    const useCase = new UpdateCustomerUseCase(repository);
    const result = await useCase.execute("customer-1", { name: "John Updated" });

    expect(result.id).toBe("customer-1");
    expect(repository.update).toHaveBeenCalledWith("customer-1", { name: "John Updated" });
  });

  it("throws not found when customer does not exist", async () => {
    const useCase = new UpdateCustomerUseCase(repository);

    await expect(useCase.execute("missing", { name: "X" })).rejects.toThrow(NotFoundException);
  });

  it("throws conflict when email already belongs to another customer", async () => {
    vi.mocked(repository.findById).mockResolvedValue(createCustomerEntity("customer-1", "john@example.com"));
    vi.mocked(repository.findByEmail).mockResolvedValue(createCustomerEntity("customer-2", "taken@example.com"));

    const useCase = new UpdateCustomerUseCase(repository);

    await expect(
      useCase.execute("customer-1", { email: "taken@example.com" }),
    ).rejects.toThrow(ConflictException);

    expect(repository.update).not.toHaveBeenCalled();
  });
});
