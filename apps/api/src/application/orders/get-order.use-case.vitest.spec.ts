import { describe, expect, it, vi, beforeEach } from "vitest";
import { GetOrderUseCase } from "./get-order.use-case";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import type { IOrderRepository, OrderEntity } from "../../domain/orders/order.types";

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
    ],
    createdAt: "2026-04-06T10:00:00.000Z",
    updatedAt: "2026-04-06T10:00:00.000Z",
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
    update: vi.fn(async () => mockOrder),
    delete: vi.fn(async () => undefined),
    generateNextOrderNumber: vi.fn(async () => "ORD-2026-0001"),
  };
}

describe("GetOrderUseCase", () => {
  let mockRepo: IOrderRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
  });

  it("returns order when found", async () => {
    const useCase = new GetOrderUseCase(mockRepo);
    const result = await useCase.execute("order-1");

    expect(result).toMatchObject({
      id: "order-1",
      number: "ORD-2026-0001",
      status: "PENDING",
    });
    expect(mockRepo.findById).toHaveBeenCalledWith("order-1");
    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
  });

  it("throws NotFoundException when order not found", async () => {
    const useCase = new GetOrderUseCase(mockRepo);

    await expect(useCase.execute("non-existent-id")).rejects.toThrow(
      NotFoundException,
    );
    await expect(useCase.execute("non-existent-id")).rejects.toThrow(
      "Order not found",
    );
    expect(mockRepo.findById).toHaveBeenCalledWith("non-existent-id");
  });
});
