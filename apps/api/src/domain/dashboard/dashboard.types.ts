export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED";

export type DashboardKpis = {
  totalOrders: number;
  totalRevenue: string;
  totalCustomers: number;
  totalProducts: number;
};

export type MonthlyOrderData = {
  month: string;
  total: string;
  count: number;
  statusBreakdown: Record<OrderStatus, number>;
};

export interface IDashboardRepository {
  getKpis(): Promise<DashboardKpis>;
  getMonthlyOrders(limit?: number): Promise<MonthlyOrderData[]>;
}
