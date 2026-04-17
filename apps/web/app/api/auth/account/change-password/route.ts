import { NextResponse } from "next/server";
import { changeOwnPasswordWithApi } from "@/src/services/auth/api";
import type { ChangeOwnPasswordInput } from "@/src/services/auth/types";
import {
  getRouteAccessToken,
  handleRouteError,
  unauthorizedRouteResponse,
} from "@/src/services/shared/route-handler";

export async function POST(request: Request) {
  const accessToken = await getRouteAccessToken();

  if (accessToken === null) {
    return unauthorizedRouteResponse();
  }

  try {
    const body = (await request.json()) as ChangeOwnPasswordInput;
    const result = await changeOwnPasswordWithApi(accessToken, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
