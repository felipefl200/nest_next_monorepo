import { describe, expect, it, vi, beforeEach } from "vitest";
import { DeleteOrderUseCase } from "./delete-order.use-case";
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

describe("DeleteOrderUseCase", () => {
  let mockRepo: IOrderRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
  });

  it("deletes order successfully", async () => {
    const useCase = new DeleteOrderUseCase(mockRepo);
    await useCase.execute("order-1");

    expect(mockRepo.findById).toHaveBeenCalledWith("order-1");
    expect(mockRepo.delete).toHaveBeenCalledWith("order-1");
    expect(mockRepo.delete).toHaveBeenCalledTimes(1);
  });

  it("throws NotFoundException when order not found", async () => {
    const useCase = new DeleteOrderUseCase(mockRepo);

    await expect(useCase.execute("non-existent-id")).rejects.toThrow(
      NotFoundException,
    );
    await expect(useCase.execute("non-existent-id")).rejects.toThrow(
      "Order not found",
    );
    expect(mockRepo.delete).not.toHaveBeenCalled();
  });
});
