import { deleteRequest, requestJson } from "../shared/api-client";
import type { Order, OrderMutationInput, OrdersQuery, PaginatedOrders } from "./types";

export async function listOrdersWithApi(
  accessToken: string,
  query: OrdersQuery,
): Promise<PaginatedOrders> {
  return requestJson<PaginatedOrders>({
    method: "GET",
    path: "/orders",
    accessToken,
    query,
  });
}

export async function getOrderWithApi(
  accessToken: string,
  id: string,
): Promise<Order> {
  return requestJson<Order>({
    method: "GET",
    path: `/orders/${id}`,
    accessToken,
  });
}

export async function createOrderWithApi(
  accessToken: string,
  input: OrderMutationInput,
): Promise<Order> {
  return requestJson<Order>({
    method: "POST",
    path: "/orders",
    accessToken,
    body: input,
  });
}

export async function updateOrderWithApi(
  accessToken: string,
  id: string,
  input: OrderMutationInput & { status: NonNullable<OrderMutationInput["status"]> },
): Promise<Order> {
  return requestJson<Order>({
    method: "PATCH",
    path: `/orders/${id}`,
    accessToken,
    body: input,
  });
}

export async function deleteOrderWithApi(
  accessToken: string,
  id: string,
): Promise<void> {
  await deleteRequest(`/orders/${id}`, accessToken);
}
