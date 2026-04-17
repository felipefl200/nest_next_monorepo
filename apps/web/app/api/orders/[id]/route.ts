import { NextResponse } from "next/server";
import {
  deleteOrderWithApi,
  getOrderWithApi,
  updateOrderWithApi,
} from "@/src/services/orders/api";
import {
  getRouteAccessToken,
  handleRouteError,
  unauthorizedRouteResponse,
} from "@/src/services/shared/route-handler";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const accessToken = await getRouteAccessToken();

  if (accessToken === null) {
    return unauthorizedRouteResponse();
  }

  const { id } = await context.params;

  try {
    const order = await getOrderWithApi(accessToken, id);
    return NextResponse.json(order);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const accessToken = await getRouteAccessToken();

  if (accessToken === null) {
    return unauthorizedRouteResponse();
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      customerId: string;
      status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELED";
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: string;
      }>;
    };

    const order = await updateOrderWithApi(accessToken, id, body);
    return NextResponse.json(order);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const accessToken = await getRouteAccessToken();

  if (accessToken === null) {
    return unauthorizedRouteResponse();
  }

  const { id } = await context.params;

  try {
    await deleteOrderWithApi(accessToken, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
