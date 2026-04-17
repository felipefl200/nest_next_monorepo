import { beforeEach, describe, expect, it, vi } from "vitest";
import { GetCustomerUseCase } from "./get-customer.use-case";
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
    findByTaxId: vi.fn(async () => null),
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

describe("GetCustomerUseCase", () => {
  let repository: ICustomerRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it("returns customer when found", async () => {
    const entity = createCustomerEntity();
    vi.mocked(repository.findById).mockResolvedValue(entity);

    const useCase = new GetCustomerUseCase(repository);
    const result = await useCase.execute("customer-1");

    expect(result.id).toBe("customer-1");
  });

  it("throws not found when missing", async () => {
    const useCase = new GetCustomerUseCase(repository);

    await expect(useCase.execute("missing")).rejects.toThrow(NotFoundException);
  });
});
