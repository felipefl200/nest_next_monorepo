import { describe, expect, it, vi, beforeEach } from "vitest";
import { GetDashboardOverviewUseCase } from "./get-dashboard-overview.use-case";
import type { IDashboardRepository, DashboardKpis, MonthlyOrderData } from "../../domain/dashboard/dashboard.types";

function createMockRepository(): IDashboardRepository {
  const kpis: DashboardKpis = {
    totalOrders: 1500,
    totalRevenue: "150000.00",
    totalCustomers: 200,
    totalProducts: 50,
  };

  const monthlyOrders: MonthlyOrderData[] = [
    {
      month: "2026-01",
      count: 100,
      total: "10000.00",
      statusBreakdown: {
        PENDING: 20,
        CONFIRMED: 30,
        SHIPPED: 25,
        DELIVERED: 20,
        CANCELED: 5,
      },
    },
    {
      month: "2026-02",
      count: 120,
      total: "12000.00",
      statusBreakdown: {
        PENDING: 25,
        CONFIRMED: 35,
        SHIPPED: 30,
        DELIVERED: 25,
        CANCELED: 5,
      },
    },
  ];

  return {
    getKpis: vi.fn(async () => kpis),
    getMonthlyOrders: vi.fn(async (limit?: number) => monthlyOrders.slice(-(limit ?? 6))),
  };
}

describe("GetDashboardOverviewUseCase", () => {
  let mockRepo: IDashboardRepository;

  beforeEach(() => {
    mockRepo = createMockRepository();
  });

  it("returns KPIs and monthly orders", async () => {
    const useCase = new GetDashboardOverviewUseCase(mockRepo);

    const result = await useCase.execute(6);

    expect(result.kpis).toEqual({
      totalOrders: 1500,
      totalRevenue: "150000.00",
      totalCustomers: 200,
      totalProducts: 50,
    });
    expect(result.monthlyOrders).toHaveLength(2);
    expect(mockRepo.getKpis).toHaveBeenCalledTimes(1);
    expect(mockRepo.getMonthlyOrders).toHaveBeenCalledWith(6);
  });

  it("uses default of 6 months when not specified", async () => {
    const useCase = new GetDashboardOverviewUseCase(mockRepo);

    await useCase.execute();

    expect(mockRepo.getMonthlyOrders).toHaveBeenCalledWith(6);
  });

  it("fetches KPIs and monthly orders in parallel", async () => {
    const useCase = new GetDashboardOverviewUseCase(mockRepo);

    await useCase.execute(3);

    expect(mockRepo.getKpis).toHaveBeenCalled();
    expect(mockRepo.getMonthlyOrders).toHaveBeenCalledWith(3);
  });

  it("returns zero KPIs when no data exists", async () => {
    const emptyRepo: IDashboardRepository = {
      getKpis: vi.fn(async () => ({
        totalOrders: 0,
        totalRevenue: "0",
        totalCustomers: 0,
        totalProducts: 0,
      })),
      getMonthlyOrders: vi.fn(async () => []),
    };

    const useCase = new GetDashboardOverviewUseCase(emptyRepo);
    const result = await useCase.execute();

    expect(result.kpis.totalOrders).toBe(0);
    expect(result.kpis.totalRevenue).toBe("0");
    expect(result.monthlyOrders).toEqual([]);
  });
});
