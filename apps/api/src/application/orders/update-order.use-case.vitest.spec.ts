import { describe, expect, it, vi, beforeEach } from "vitest";
import { UpdateOrderUseCase } from "./update-order.use-case";
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
    items: [],
    createdAt: "2026-04-06T10:00:00.000Z",
    updatedAt: "2026-04-06T10:00:00.000Z",
  };

  const updatedOrder: OrderEntity = {
    ...mockOrder,
    status: "CONFIRMED",
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
    updateStatus: vi.fn(async () => updatedOrder),
    delete: vi.fn(async () => undefined),
    generateNextOrderNumber: vi.fn(async () => "ORD-2026-0001"),
  };
}

describe("UpdateOrderUseCase", () => {
  let mockRepo: IOrderRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
  });

  it("updates order status successfully", async () => {
    const useCase = new UpdateOrderUseCase(mockRepo);
    const result = await useCase.execute("order-1", "CONFIRMED");

    expect(result.status).toBe("CONFIRMED");
    expect(mockRepo.findById).toHaveBeenCalledWith("order-1");
    expect(mockRepo.updateStatus).toHaveBeenCalledWith("order-1", "CONFIRMED");
  });

  it("throws NotFoundException when order not found", async () => {
    const useCase = new UpdateOrderUseCase(mockRepo);

    await expect(
      useCase.execute("non-existent-id", "CONFIRMED"),
    ).rejects.toThrow(NotFoundException);
    await expect(
      useCase.execute("non-existent-id", "CONFIRMED"),
    ).rejects.toThrow("Order not found");
  });

  it("can update to any valid status", async () => {
    const statuses = [
      "PENDING",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
      "CANCELED",
    ] as const;

    const useCase = new UpdateOrderUseCase(mockRepo);

    for (const status of statuses) {
      await useCase.execute("order-1", status);
      expect(mockRepo.updateStatus).toHaveBeenCalledWith("order-1", status);
    }
  });
});
