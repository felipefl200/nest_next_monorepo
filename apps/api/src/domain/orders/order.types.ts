import type { PaginatedResult } from "../shared/pagination.types";
import type { PaginationQuery } from "../shared/query.types";
export type { PaginatedResult } from "../shared/pagination.types";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED";

export type OrderItemData = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
};

export type OrderItemInput = {
  productId: string;
  quantity: number;
  unitPrice: string;
};

export type OrderEntity = {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  total: string;
  items: OrderItemData[];
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderInput = {
  customerId: string;
  items: OrderItemInput[];
};

export type UpdateOrderInput = {
  customerId: string;
  status: OrderStatus;
  items: OrderItemInput[];
};

export type ListOrdersQuery = PaginationQuery & {
  status?: OrderStatus;
  customerId?: string;
};

export interface IOrderRepository {
  create(input: CreateOrderInput): Promise<OrderEntity>;
  findById(id: string): Promise<OrderEntity | null>;
  findByNumber(number: string): Promise<OrderEntity | null>;
  list(query: ListOrdersQuery): Promise<PaginatedResult<OrderEntity>>;
  update(id: string, input: UpdateOrderInput): Promise<OrderEntity>;
  delete(id: string): Promise<void>;
  generateNextOrderNumber(): Promise<string>;
}
