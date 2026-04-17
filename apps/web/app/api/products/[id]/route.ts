import { NextResponse } from "next/server";
import {
  deleteProductWithApi,
  getProductWithApi,
  updateProductWithApi,
} from "@/src/services/products/api";
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
    const product = await getProductWithApi(accessToken, id);
    return NextResponse.json(product);
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
      name: string;
      description?: string;
      category: string;
      price: string;
      stock: number;
      isActive: boolean;
    };

    const product = await updateProductWithApi(accessToken, id, body);
    return NextResponse.json(product);
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
    await deleteProductWithApi(accessToken, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
