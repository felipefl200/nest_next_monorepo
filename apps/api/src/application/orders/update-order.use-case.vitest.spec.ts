import { describe, expect, it, vi, beforeEach } from "vitest";
import { UpdateOrderUseCase } from "./update-order.use-case";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { ICustomerRepository } from "../../domain/customers/customer.types";
import type { IOrderRepository, OrderEntity, UpdateOrderInput } from "../../domain/orders/order.types";
import type { IProductRepository, ProductEntity } from "../../domain/products/product.types";

function createMockRepository(): IOrderRepository {
  const mockOrder: OrderEntity = {
    id: "order-1",
    number: "ORD-2026-0001",
    customerId: "customer-1",
    customerName: "Test Customer",
    status: "PENDING",
    total: "150.00",
    items: [],
    createdAt: "2026-04-06T10:00:00.000Z",
    updatedAt: "2026-04-06T10:00:00.000Z",
  };

  const updatedOrder: OrderEntity = {
    ...mockOrder,
    customerId: "customer-2",
    status: "CONFIRMED",
    items: [
      {
        productId: "product-2",
        productName: "Product 2",
        quantity: 3,
        unitPrice: "40.00",
      },
    ],
    total: "120.00",
    updatedAt: "2026-04-06T12:00:00.000Z",
  };

  return {
    create: vi.fn(async () => mockOrder),
    findById: vi.fn(async (id: string) => (id === "order-1" ? mockOrder : null)),
    findByNumber: vi.fn(async () => null),
    list: vi.fn(async () => ({
      data: [],
      total: 0,
      page: 1,
      perPage: 20,
      totalPages: 0,
    })),
    update: vi.fn(async () => updatedOrder),
    delete: vi.fn(async () => undefined),
    generateNextOrderNumber: vi.fn(async () => "ORD-2026-0001"),
  };
}

function createMockCustomerRepository(): ICustomerRepository {
  return {
    create: vi.fn(async () => {
      throw new Error("Not implemented");
    }),
    findById: vi.fn(async (id: string) =>
      id.startsWith("customer-")
        ? {
            id,
            name: `Customer ${id}`,
            email: `${id}@example.com`,
            phone: "+55 11 99999-9999",
            taxId: null,
            createdAt: "2026-04-06T10:00:00.000Z",
            updatedAt: "2026-04-06T10:00:00.000Z",
          }
        : null,
    ),
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
      stock: 10,
      isActive: true,
      createdAt: "2026-04-06T10:00:00.000Z",
      updatedAt: "2026-04-06T10:00:00.000Z",
    },
    {
      id: "product-2",
      name: "Product 2",
      description: null,
      category: "Category",
      price: "40.00",
      stock: 10,
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

describe("UpdateOrderUseCase", () => {
  let mockRepo: IOrderRepository;
  let customerRepository: ICustomerRepository;
  let productRepository: IProductRepository;
  const input: UpdateOrderInput = {
    customerId: "customer-2",
    status: "CONFIRMED",
    items: [
      {
        productId: "product-2",
        quantity: 3,
        unitPrice: "40.00",
      },
    ],
  };

  beforeEach(() => {
    mockRepo = createMockRepository();
    customerRepository = createMockCustomerRepository();
    productRepository = createMockProductRepository();
  });

  it("updates order successfully", async () => {
    const useCase = new UpdateOrderUseCase(mockRepo, customerRepository, productRepository);
    const result = await useCase.execute("order-1", input);

    expect(result.status).toBe("CONFIRMED");
    expect(mockRepo.findById).toHaveBeenCalledWith("order-1");
    expect(mockRepo.update).toHaveBeenCalledWith("order-1", input);
  });

  it("throws NotFoundException when order not found", async () => {
    const useCase = new UpdateOrderUseCase(mockRepo, customerRepository, productRepository);

    await expect(
      useCase.execute("non-existent-id", input),
    ).rejects.toThrow(NotFoundException);
    await expect(
      useCase.execute("non-existent-id", input),
    ).rejects.toThrow("Order not found");
  });

  it("throws when customer does not exist", async () => {
    vi.mocked(customerRepository.findById).mockResolvedValue(null);

    const useCase = new UpdateOrderUseCase(mockRepo, customerRepository, productRepository);

    await expect(useCase.execute("order-1", input)).rejects.toThrow(NotFoundException);
  });

  it("throws when a product does not exist", async () => {
    vi.mocked(productRepository.findManyByIds).mockResolvedValue([]);

    const useCase = new UpdateOrderUseCase(mockRepo, customerRepository, productRepository);

    await expect(useCase.execute("order-1", input)).rejects.toThrow(NotFoundException);
  });
});
