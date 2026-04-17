import { z } from "zod";
import type { OrderStatus } from "./order.types";

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELED",
]) as z.ZodType<OrderStatus>;

export const createOrderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
});

export const createOrderSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  items: z
    .array(createOrderItemSchema)
    .min(1, "Order must have at least one item"),
});

export const updateOrderSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  status: orderStatusSchema,
  items: z
    .array(createOrderItemSchema)
    .min(1, "Order must have at least one item"),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  status: orderStatusSchema.optional(),
  customerId: z.string().optional(),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type UpdateOrderDto = z.infer<typeof updateOrderSchema>;
export type ListOrdersQueryDto = z.infer<typeof listOrdersQuerySchema>;
