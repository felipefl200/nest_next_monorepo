import { NextResponse } from "next/server";
import {
  createProductWithApi,
  listProductsWithApi,
} from "@/src/services/products/api";
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
  const isActiveValue = searchParams.get("isActive");

  try {
    const products = await listProductsWithApi(accessToken, {
      page: Number(searchParams.get("page") ?? "1"),
      perPage: Number(searchParams.get("perPage") ?? "20"),
      category: searchParams.get("category") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      isActive:
        isActiveValue === null
          ? undefined
          : isActiveValue === "true",
    });

    return NextResponse.json(products);
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
      name: string;
      description?: string;
      category: string;
      price: string;
      stock: number;
      isActive: boolean;
    };

    const product = await createProductWithApi(accessToken, body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
