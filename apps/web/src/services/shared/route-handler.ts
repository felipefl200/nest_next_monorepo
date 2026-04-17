import { NextResponse } from "next/server";
import { getSessionSnapshot } from "../auth/session";
import { isApiError } from "./api-client";

export async function getRouteAccessToken(): Promise<string | null> {
  const session = await getSessionSnapshot();
  return session.accessToken;
}

export function unauthorizedRouteResponse() {
  return NextResponse.json(
    {
      code: "UNAUTHORIZED",
      message: "Sessao invalida ou expirada.",
    },
    { status: 401 },
  );
}

export function handleRouteError(error: unknown) {
  if (isApiError(error)) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
      },
      { status: error.statusCode },
    );
  }

  return NextResponse.json(
    {
      code: "UNKNOWN_ERROR",
      message: "Nao foi possivel concluir a operacao.",
    },
    { status: 500 },
  );
}
