import { describe, expect, it, vi, beforeEach } from "vitest";
import { ListOrdersUseCase } from "./list-orders.use-case";
import type {
  IOrderRepository,
  ListOrdersQuery,
  OrderEntity,
  PaginatedResult,
  OrderStatus,
} from "../../domain/orders/order.types";

function createMockRepository(): IOrderRepository {
  const mockOrders: OrderEntity[] = [
    {
      id: "order-1",
      number: "ORD-2026-0001",
      customerId: "customer-1",
      customerName: "Customer 1",
      status: "PENDING",
      total: "150.00",
      items: [],
      createdAt: "2026-04-06T10:00:00.000Z",
      updatedAt: "2026-04-06T10:00:00.000Z",
    },
    {
      id: "order-2",
      number: "ORD-2026-0002",
      customerId: "customer-2",
      customerName: "Customer 2",
      status: "CONFIRMED",
      total: "250.00",
      items: [],
      createdAt: "2026-04-06T11:00:00.000Z",
      updatedAt: "2026-04-06T11:00:00.000Z",
    },
  ];

  const mockResult: PaginatedResult<OrderEntity> = {
    data: mockOrders,
    total: 2,
    page: 1,
    perPage: 20,
    totalPages: 1,
  };

  const firstOrder = mockOrders[0]!;
  const mockCreate = vi.fn(async (_input): Promise<OrderEntity> => firstOrder);
  const mockUpdateStatus = vi.fn(async (_id: string, _status: OrderStatus): Promise<OrderEntity> => firstOrder);

  return {
    create: mockCreate,
    findById: vi.fn(async () => null),
    findByNumber: vi.fn(async () => null),
    list: vi.fn(async () => mockResult),
    updateStatus: mockUpdateStatus,
    delete: vi.fn(async () => undefined),
    generateNextOrderNumber: vi.fn(async () => "ORD-2026-0001"),
  };
}

describe("ListOrdersUseCase", () => {
  let mockRepo: IOrderRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
  });

  it("returns paginated orders", async () => {
    const query: ListOrdersQuery = {
      page: 1,
      perPage: 20,
    };

    const useCase = new ListOrdersUseCase(mockRepo);
    const result = await useCase.execute(query);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
    expect(result.totalPages).toBe(1);
    expect(mockRepo.list).toHaveBeenCalledWith(query);
  });

  it("filters orders by status", async () => {
    const query: ListOrdersQuery = {
      page: 1,
      perPage: 10,
      status: "PENDING",
    };

    const useCase = new ListOrdersUseCase(mockRepo);
    await useCase.execute(query);

    expect(mockRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "PENDING",
      }),
    );
  });

  it("filters orders by customerId", async () => {
    const query: ListOrdersQuery = {
      page: 1,
      perPage: 10,
      customerId: "customer-1",
    };

    const useCase = new ListOrdersUseCase(mockRepo);
    await useCase.execute(query);

    expect(mockRepo.list).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "customer-1",
      }),
    );
  });

  it("returns empty result when no orders exist", async () => {
    const emptyRepo: IOrderRepository = {
      create: vi.fn(async () => {
        throw new Error("Not implemented");
      }),
      findById: vi.fn(async () => null),
      findByNumber: vi.fn(async () => null),
      list: vi.fn(async () => ({
        data: [],
        total: 0,
        page: 1,
        perPage: 20,
        totalPages: 0,
      })),
      updateStatus: vi.fn(async () => {
        throw new Error("Not implemented");
      }),
      delete: vi.fn(async () => undefined),
      generateNextOrderNumber: vi.fn(async () => "ORD-2026-0001"),
    };

    const useCase = new ListOrdersUseCase(emptyRepo);
    const result = await useCase.execute({ page: 1, perPage: 20 });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
