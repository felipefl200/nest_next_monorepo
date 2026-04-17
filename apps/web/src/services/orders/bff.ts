import { requireSession } from "../auth/session";
import {
  createOrderWithApi,
  deleteOrderWithApi,
  getOrderWithApi,
  listOrdersWithApi,
  updateOrderWithApi,
} from "./api";
import type { Order, OrderMutationInput, OrdersQuery, OrderStatus, PaginatedOrders } from "./types";

async function getAccessToken(): Promise<string> {
  const session = await requireSession();

  if (session.accessToken === null) {
    throw new Error("Missing access token");
  }

  return session.accessToken;
}

export async function listOrders(query: OrdersQuery): Promise<PaginatedOrders> {
  return listOrdersWithApi(await getAccessToken(), query);
}

export async function getOrder(id: string): Promise<Order> {
  return getOrderWithApi(await getAccessToken(), id);
}

export async function createOrder(input: OrderMutationInput): Promise<Order> {
  return createOrderWithApi(await getAccessToken(), input);
}

export async function updateOrder(
  id: string,
  input: OrderMutationInput & { status: OrderStatus },
): Promise<Order> {
  return updateOrderWithApi(await getAccessToken(), id, input);
}

export async function deleteOrder(id: string): Promise<void> {
  await deleteOrderWithApi(await getAccessToken(), id);
}
