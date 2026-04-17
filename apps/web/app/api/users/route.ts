import { NextResponse } from "next/server";
import {
  createManagedUserWithApi,
  listManagedUsersWithApi,
} from "@/src/services/users/api";
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
    const users = await listManagedUsersWithApi(accessToken, {
      page: Number(searchParams.get("page") ?? "1"),
      perPage: Number(searchParams.get("perPage") ?? "20"),
      search: searchParams.get("search") ?? undefined,
    });

    return NextResponse.json(users);
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
    const body = (await request.json());

    const user = await createManagedUserWithApi(accessToken, body as any);
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
