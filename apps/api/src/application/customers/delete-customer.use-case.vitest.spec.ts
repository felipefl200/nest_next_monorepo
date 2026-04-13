import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteCustomerUseCase } from "./delete-customer.use-case";
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

function createCustomerEntity(): CustomerEntity {
  return {
    id: "customer-1",
    name: "John",
    email: "john@example.com",
    phone: "+55 11 99999-9999",
    taxId: "12345678900",
    createdAt: "2026-04-06T10:00:00.000Z",
    updatedAt: "2026-04-06T10:00:00.000Z",
  };
}

function createMockRepository(): ICustomerRepository {
  return {
    create: vi.fn(async (_input: CreateCustomerInput) => createCustomerEntity()),
    findById: vi.fn(async () => null),
    findByEmail: vi.fn(async () => null),
    list: vi.fn(async (_query: ListCustomersQuery): Promise<PaginatedResult<CustomerEntity>> => ({
      data: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    })),
    update: vi.fn(async (_id: string, _input: UpdateCustomerInput) => createCustomerEntity()),
    delete: vi.fn(async () => undefined),
    countOrdersByCustomerId: vi.fn(async () => 0),
  };
}

describe("DeleteCustomerUseCase", () => {
  let repository: ICustomerRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it("deletes customer when no related orders exist", async () => {
    vi.mocked(repository.findById).mockResolvedValue(createCustomerEntity());
    vi.mocked(repository.countOrdersByCustomerId).mockResolvedValue(0);

    const useCase = new DeleteCustomerUseCase(repository);

    await expect(useCase.execute("customer-1")).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith("customer-1");
  });

  it("throws not found when customer does not exist", async () => {
    const useCase = new DeleteCustomerUseCase(repository);

    await expect(useCase.execute("missing")).rejects.toThrow(NotFoundException);
  });

  it("throws conflict when customer has related orders", async () => {
    vi.mocked(repository.findById).mockResolvedValue(createCustomerEntity());
    vi.mocked(repository.countOrdersByCustomerId).mockResolvedValue(3);

    const useCase = new DeleteCustomerUseCase(repository);

    await expect(useCase.execute("customer-1")).rejects.toThrow(ConflictException);
    expect(repository.delete).not.toHaveBeenCalled();
  });
});
