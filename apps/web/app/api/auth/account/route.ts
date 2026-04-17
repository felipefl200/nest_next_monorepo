import { NextResponse } from "next/server";
import {
  getOwnAccountProfileWithApi,
  updateOwnAccountProfileWithApi,
} from "@/src/services/auth/api";
import type { UpdateOwnProfileInput } from "@/src/services/auth/types";
import {
  getRouteAccessToken,
  handleRouteError,
  unauthorizedRouteResponse,
} from "@/src/services/shared/route-handler";

export async function GET() {
  const accessToken = await getRouteAccessToken();

  if (accessToken === null) {
    return unauthorizedRouteResponse();
  }

  try {
    const account = await getOwnAccountProfileWithApi(accessToken);
    return NextResponse.json(account);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  const accessToken = await getRouteAccessToken();

  if (accessToken === null) {
    return unauthorizedRouteResponse();
  }

  try {
    const body = (await request.json()) as UpdateOwnProfileInput;
    const account = await updateOwnAccountProfileWithApi(accessToken, body);
    return NextResponse.json(account);
  } catch (error) {
    return handleRouteError(error);
  }
}
