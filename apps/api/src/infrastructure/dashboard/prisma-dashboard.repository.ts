import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import {
  IDashboardRepository,
  DashboardKpis,
  MonthlyOrderData,
  OrderStatus,
} from "../../domain/dashboard/dashboard.types";

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
];

type PrismaOrderGroupRecord = {
  createdAt: Date;
  _count: { id: number };
  _sum: { total: string | null };
};

@Injectable()
export class PrismaDashboardRepository implements IDashboardRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async getKpis(): Promise<DashboardKpis> {
    const ordersAgg = await this.prisma.order.aggregate({
      _count: { id: true },
      _sum: { total: true },
    });

    const totalCustomers = await this.prisma.customer.count();
    const totalProducts = await this.prisma.product.count({
      where: { isActive: true },
    });

    return {
      totalOrders: ordersAgg[0]?._count?.id ?? 0,
      totalRevenue: ordersAgg[0]?._sum?.total?.toString() ?? "0",
      totalCustomers,
      totalProducts,
    };
  }

  public async getMonthlyOrders(limit = 6): Promise<MonthlyOrderData[]> {
    const records = (await this.prisma.order.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      _sum: { total: true },
    })) as unknown as PrismaOrderGroupRecord[];

    const monthMap = new Map<string, MonthlyOrderData>();

    for (const record of records) {
      const date = new Date(record.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

      const existing = monthMap.get(monthKey);
      if (existing) {
        existing.count += record._count.id;
        existing.total = (
          Number.parseFloat(existing.total) + Number.parseFloat(record._sum.total ?? "0")
        ).toFixed(2);
      } else {
        monthMap.set(monthKey, {
          month: monthKey,
          count: record._count.id,
          total: Number.parseFloat(record._sum.total ?? "0").toFixed(2),
          statusBreakdown: Object.fromEntries(
            ALL_STATUSES.map((s) => [s, 0]),
          ) as Record<OrderStatus, number>,
        });
      }
    }

    const sorted = Array.from(monthMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-limit);

    return sorted;
  }
}
