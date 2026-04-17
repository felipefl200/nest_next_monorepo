import { NextResponse } from "next/server";
import {
  createCustomerWithApi,
  listCustomersWithApi,
} from "@/src/services/customers/api";
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
    const customers = await listCustomersWithApi(accessToken, {
      page: Number(searchParams.get("page") ?? "1"),
      perPage: Number(searchParams.get("perPage") ?? "20"),
      search: searchParams.get("search") ?? undefined,
    });

    return NextResponse.json(customers);
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
      email: string;
      phone: string;
      taxId?: string | null;
    };

    const customer = await createCustomerWithApi(accessToken, body);
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
