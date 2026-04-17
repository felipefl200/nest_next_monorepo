import { NextResponse } from "next/server";
import { createOrderWithApi, listOrdersWithApi } from "@/src/services/orders/api";
import {
  getRouteAccessToken,
  handleRouteError,
  unauthorizedRouteResponse,
} from "@/src/services/shared/route-handler";

export async function GET(request: Request) {
  const accessToken = await getRouteAccessToken();

  if (accessToken === null) {
    return unauthorizedRouteResponse();
  }

  const { searchParams } = new URL(request.url);

  try {
    const orders = await listOrdersWithApi(accessToken, {
      page: Number(searchParams.get("page") ?? "1"),
      perPage: Number(searchParams.get("perPage") ?? "20"),
      status:
        (searchParams.get("status") as
          | "PENDING"
          | "CONFIRMED"
          | "SHIPPED"
          | "DELIVERED"
          | "CANCELED"
          | null) ?? undefined,
      customerId: searchParams.get("customerId") ?? undefined,
    });

    return NextResponse.json(orders);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  const accessToken = await getRouteAccessToken();

  if (accessToken === null) {
    return unauthorizedRouteResponse();
  }

  try {
    const body = (await request.json()) as {
      customerId: string;
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: string;
      }>;
    };

    const order = await createOrderWithApi(accessToken, body);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
