import { describe, expect, it, vi, beforeEach } from "vitest";
import { CreateOrderUseCase } from "./create-order.use-case";
import type {
  IOrderRepository,
  CreateOrderInput,
  OrderEntity,
} from "../../domain/orders/order.types";

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
        quantity: 2,
        unitPrice: "50.00",
      },
      {
        productId: "product-2",
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
    updateStatus: vi.fn(async () => mockOrder),
    delete: vi.fn(async () => undefined),
    generateNextOrderNumber: vi.fn(async () => "ORD-2026-0001"),
  };
}

describe("CreateOrderUseCase", () => {
  let mockRepo: IOrderRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
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

    const useCase = new CreateOrderUseCase(mockRepo);
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

    const useCase = new CreateOrderUseCase(mockRepo);
    await useCase.execute(input);

    expect(mockRepo.create).toHaveBeenCalledWith(input);
  });
});
