import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { GetDashboardOverviewUseCase } from "../../application/dashboard/get-dashboard-overview.use-case";

type DashboardOverviewQuery = {
  months?: string;
};

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
  public constructor(
    private readonly getDashboardOverviewUseCase: GetDashboardOverviewUseCase,
  ) {}

  @Get("overview")
  public async getOverview(@Query() query: DashboardOverviewQuery) {
    const months = query.months ? Number.parseInt(query.months, 10) : 6;
    return this.getDashboardOverviewUseCase.execute(months);
  }
}
