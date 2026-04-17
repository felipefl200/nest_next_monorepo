import { describe, expect, it, vi, beforeEach } from "vitest";
import { CreateOrderUseCase } from "./create-order.use-case";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { ICustomerRepository } from "../../domain/customers/customer.types";
import type {
  IOrderRepository,
  CreateOrderInput,
  OrderEntity,
} from "../../domain/orders/order.types";
import type { IProductRepository, ProductEntity } from "../../domain/products/product.types";

function createMockRepository(): IOrderRepository {
  const mockOrder: OrderEntity = {
    id: "order-1",
    number: "ORD-2026-0001",
    customerId: "customer-1",
    customerName: "Test Customer",
    status: "PENDING",
    total: "150.00",
    items: [
      {
        productId: "product-1",
        productName: "Product 1",
        quantity: 2,
        unitPrice: "50.00",
      },
      {
        productId: "product-2",
        productName: "Product 2",
        quantity: 1,
        unitPrice: "50.00",
      },
    ],
    createdAt: "2026-04-06T10:00:00.000Z",
    updatedAt: "2026-04-06T10:00:00.000Z",
  };

  return {
    create: vi.fn(async () => mockOrder),
    findById: vi.fn(async () => null),
    findByNumber: vi.fn(async () => null),
    list: vi.fn(async () => ({
      data: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    })),
    update: vi.fn(async () => mockOrder),
    delete: vi.fn(async () => undefined),
    generateNextOrderNumber: vi.fn(async () => "ORD-2026-0001"),
  };
}

function createMockCustomerRepository(): ICustomerRepository {
  return {
    create: vi.fn(async () => {
      throw new Error("Not implemented");
    }),
    findById: vi.fn(async () => ({
      id: "customer-1",
      name: "Test Customer",
      email: "customer@example.com",
      phone: "+55 11 99999-9999",
      taxId: null,
      createdAt: "2026-04-06T10:00:00.000Z",
      updatedAt: "2026-04-06T10:00:00.000Z",
    })),
    findByEmail: vi.fn(async () => null),
    findByTaxId: vi.fn(async () => null),
    list: vi.fn(async () => ({
      data: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    })),
    update: vi.fn(async () => {
      throw new Error("Not implemented");
    }),
    delete: vi.fn(async () => undefined),
    countOrdersByCustomerId: vi.fn(async () => 0),
  };
}

function createMockProductRepository(): IProductRepository {
  const products: ProductEntity[] = [
    {
      id: "product-1",
      name: "Product 1",
      description: null,
      category: "Category",
      price: "50.00",
      stock: 5,
      isActive: true,
      createdAt: "2026-04-06T10:00:00.000Z",
      updatedAt: "2026-04-06T10:00:00.000Z",
    },
    {
      id: "product-2",
      name: "Product 2",
      description: null,
      category: "Category",
      price: "50.00",
      stock: 5,
      isActive: true,
      createdAt: "2026-04-06T10:00:00.000Z",
      updatedAt: "2026-04-06T10:00:00.000Z",
    },
  ];

  return {
    create: vi.fn(async () => products[0]!),
    findById: vi.fn(async (id: string) => products.find((product) => product.id === id) ?? null),
    findManyByIds: vi.fn(async (ids: string[]) =>
      products.filter((product) => ids.includes(product.id)),
    ),
    list: vi.fn(async () => ({
      data: products,
      total: products.length,
      page: 1,
      perPage: 20,
      totalPages: 1,
    })),
    update: vi.fn(async () => products[0]!),
    delete: vi.fn(async () => undefined),
    countOrderItemsByProductId: vi.fn(async () => 0),
  };
}

describe("CreateOrderUseCase", () => {
  let mockRepo: IOrderRepository;
  let customerRepository: ICustomerRepository;
  let productRepository: IProductRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
    customerRepository = createMockCustomerRepository();
    productRepository = createMockProductRepository();
  });

  it("creates an order successfully", async () => {
    const input: CreateOrderInput = {
      customerId: "customer-1",
      items: [
        {
          productId: "product-1",
          quantity: 2,
          unitPrice: "50.00",
        },
        {
          productId: "product-2",
          quantity: 1,
          unitPrice: "50.00",
        },
      ],
    };

    const useCase = new CreateOrderUseCase(mockRepo, customerRepository, productRepository);
    const result = await useCase.execute(input);

    expect(result).toMatchObject({
      id: "order-1",
      number: "ORD-2026-0001",
      customerId: "customer-1",
      status: "PENDING",
      total: "150.00",
    });
    expect(result.items).toHaveLength(2);
    expect(mockRepo.create).toHaveBeenCalledWith(input);
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
  });

  it("creates an order with single item", async () => {
    const input: CreateOrderInput = {
      customerId: "customer-1",
      items: [
        {
          productId: "product-1",
          quantity: 1,
          unitPrice: "99.99",
        },
      ],
    };

    const useCase = new CreateOrderUseCase(mockRepo, customerRepository, productRepository);
    await useCase.execute(input);

    expect(mockRepo.create).toHaveBeenCalledWith(input);
  });

  it("throws when customer does not exist", async () => {
    vi.mocked(customerRepository.findById).mockResolvedValue(null);

    const useCase = new CreateOrderUseCase(mockRepo, customerRepository, productRepository);

    await expect(
      useCase.execute({
        customerId: "missing-customer",
        items: [{ productId: "product-1", quantity: 1, unitPrice: "50.00" }],
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
