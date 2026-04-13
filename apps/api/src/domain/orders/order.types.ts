export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED";

export type OrderItemData = {
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
  items: {
    productId: string;
    quantity: number;
    unitPrice: string;
  }[];
};

export type UpdateOrderInput = {
  id: string;
  status: OrderStatus;
};

export type ListOrdersQuery = {
  page: number;
  perPage: number;
  status?: OrderStatus;
  customerId?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export interface IOrderRepository {
  create(input: CreateOrderInput): Promise<OrderEntity>;
  findById(id: string): Promise<OrderEntity | null>;
  findByNumber(number: string): Promise<OrderEntity | null>;
  list(query: ListOrdersQuery): Promise<PaginatedResult<OrderEntity>>;
  updateStatus(id: string, status: OrderStatus): Promise<OrderEntity>;
  delete(id: string): Promise<void>;
  generateNextOrderNumber(): Promise<string>;
}
