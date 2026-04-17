import type { PaginatedResponse } from "../shared/types";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED";

export type OrderItem = {
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

export type Order = {
  id: string;
  number: string;
  customerId: string;
  customerName: string;
  status: OrderStatus;
  total: string;
  items: OrderItem[];
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderMutationInput = {
  customerId: string;
  status?: OrderStatus;
  items: OrderItemInput[];
};

export type OrdersQuery = {
  page?: number;
  perPage?: number;
  status?: OrderStatus;
  customerId?: string;
};

export type PaginatedOrders = PaginatedResponse<Order>;
