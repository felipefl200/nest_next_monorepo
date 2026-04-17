import { NextResponse } from "next/server";
import {
  deleteCustomerWithApi,
  getCustomerWithApi,
  updateCustomerWithApi,
} from "@/src/services/customers/api";
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
    const customer = await getCustomerWithApi(accessToken, id);
    return NextResponse.json(customer);
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
      email: string;
      phone: string;
      taxId?: string | null;
    };

    const customer = await updateCustomerWithApi(accessToken, id, body);
    return NextResponse.json(customer);
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
    await deleteCustomerWithApi(accessToken, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
