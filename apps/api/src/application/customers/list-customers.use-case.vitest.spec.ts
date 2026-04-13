import { beforeEach, describe, expect, it, vi } from "vitest";
import { ListCustomersUseCase } from "./list-customers.use-case";
import type {
  CreateCustomerInput,
  CustomerEntity,
  ICustomerRepository,
  ListCustomersQuery,
  PaginatedResult,
  UpdateCustomerInput,
} from "../../domain/customers/customer.types";

function createMockRepository(): ICustomerRepository {
  const customer: CustomerEntity = {
    id: "customer-1",
    name: "John",
    email: "john@example.com",
    phone: "+55 11 99999-9999",
    taxId: "12345678900",
    createdAt: "2026-04-06T10:00:00.000Z",
    updatedAt: "2026-04-06T10:00:00.000Z",
  };

  return {
    create: vi.fn(async (_input: CreateCustomerInput) => customer),
    findById: vi.fn(async () => customer),
    findByEmail: vi.fn(async () => customer),
    list: vi.fn(async (query: ListCustomersQuery): Promise<PaginatedResult<CustomerEntity>> => ({
      data: [customer],
      total: 1,
      page: query.page,
      perPage: query.perPage,
      totalPages: 1,
    })),
    update: vi.fn(async (_id: string, _input: UpdateCustomerInput) => customer),
    delete: vi.fn(async () => undefined),
    countOrdersByCustomerId: vi.fn(async () => 0),
  };
}

describe("ListCustomersUseCase", () => {
  let repository: ICustomerRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it("returns paginated customers", async () => {
    const useCase = new ListCustomersUseCase(repository);

    const result = await useCase.execute({
      page: 2,
      perPage: 10,
      search: "john",
    });

    expect(result.page).toBe(2);
    expect(result.perPage).toBe(10);
    expect(result.data).toHaveLength(1);
    expect(repository.list).toHaveBeenCalledWith({
      page: 2,
      perPage: 10,
      search: "john",
    });
  });
});
