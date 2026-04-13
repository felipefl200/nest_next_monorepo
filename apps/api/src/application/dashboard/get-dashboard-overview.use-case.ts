import { Injectable, Inject } from "@nestjs/common";
import { DASHBOARD_REPOSITORY } from "../../domain/tokens";
import type { IDashboardRepository, DashboardKpis, MonthlyOrderData } from "../../domain/dashboard/dashboard.types";

export type DashboardOverviewResult = {
  kpis: DashboardKpis;
  monthlyOrders: MonthlyOrderData[];
};

@Injectable()
export class GetDashboardOverviewUseCase {
  public constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: IDashboardRepository,
  ) {}

  public async execute(months = 6): Promise<DashboardOverviewResult> {
    const [kpis, monthlyOrders] = await Promise.all([
      this.dashboardRepository.getKpis(),
      this.dashboardRepository.getMonthlyOrders(months),
    ]);

    return { kpis, monthlyOrders };
  }
}
