import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateCustomerUseCase } from "./create-customer.use-case";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
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

function createCustomerEntity(id = "customer-1", email = "john@example.com"): CustomerEntity {
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
    create: vi.fn(async (input: CreateCustomerInput) => createCustomerEntity("customer-1", input.email)),
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
    update: vi.fn(async (_id: string, _input: UpdateCustomerInput) => createCustomerEntity()),
    delete: vi.fn(async () => undefined),
    countOrdersByCustomerId: vi.fn(async () => 0),
  };
}

describe("CreateCustomerUseCase", () => {
  let repository: ICustomerRepository;

  beforeEach(() => {
    repository = createMockRepository();
  });

  it("creates customer when email is unique", async () => {
    const useCase = new CreateCustomerUseCase(repository);

    const result = await useCase.execute(
      {
        name: "John",
        email: "john@example.com",
        phone: "+55 11 99999-9999",
        taxId: "12345678900",
      },
      ACTOR,
    );

    expect(result.email).toBe("john@example.com");
    expect(repository.findByEmail).toHaveBeenCalledWith("john@example.com");
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it("throws conflict when email already exists", async () => {
    const existing = createCustomerEntity("customer-2", "john@example.com");
    vi.mocked(repository.findByEmail).mockResolvedValue(existing);

    const useCase = new CreateCustomerUseCase(repository);

    await expect(
      useCase.execute(
        {
          name: "John",
          email: "john@example.com",
          phone: "+55 11 99999-9999",
        },
        ACTOR,
      ),
    ).rejects.toThrow(ConflictException);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it("throws conflict when taxId already exists", async () => {
    vi.mocked(repository.findByTaxId).mockResolvedValue(createCustomerEntity("customer-2"));

    const useCase = new CreateCustomerUseCase(repository);

    await expect(
      useCase.execute(
        {
          name: "John",
          email: "another@example.com",
          phone: "+55 11 99999-9999",
          taxId: "12345678900",
        },
        ACTOR,
      ),
    ).rejects.toThrow(ConflictException);
  });
});
