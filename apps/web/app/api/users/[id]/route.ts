import { NextResponse } from "next/server";
import {
  deactivateManagedUserWithApi,
  updateManagedUserWithApi,
} from "@/src/services/users/api";
import {
  getRouteAccessToken,
  handleRouteError,
  unauthorizedRouteResponse,
} from "@/src/services/shared/route-handler";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteParams) {
  const accessToken = await getRouteAccessToken();

  if (accessToken === null) {
    return unauthorizedRouteResponse();
  }

  try {
    const resolvedParams = await context.params;
    const body = (await request.json());

    const user = await updateManagedUserWithApi(accessToken, resolvedParams.id, body as any);
    return NextResponse.json(user);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: Request, context: RouteParams) {
  const accessToken = await getRouteAccessToken();

  if (accessToken === null) {
    return unauthorizedRouteResponse();
  }

  try {
    const resolvedParams = await context.params;
    await deactivateManagedUserWithApi(accessToken, resolvedParams.id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
