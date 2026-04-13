import { NextResponse } from "next/server";
import { loginWithApi } from "@/src/services/auth/api";
import { DEFAULT_LOGIN_REDIRECT } from "@/src/services/auth/constants";
import { persistAuthCookies } from "@/src/services/auth/session";
import type { AuthApiError, LoginInput } from "@/src/services/auth/types";

function validateBody(body: unknown): LoginInput | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const record = body as Record<string, unknown>;

  if (typeof record.email !== "string" || typeof record.password !== "string") {
    return null;
  }

  return {
    email: record.email.trim(),
    password: record.password,
  };
}

function normalizeError(error: unknown): AuthApiError {
  if (
    typeof error === "object" &&
    error !== null &&
    typeof (error as Record<string, unknown>).code === "string" &&
    typeof (error as Record<string, unknown>).message === "string" &&
    typeof (error as Record<string, unknown>).statusCode === "number"
  ) {
    return error as AuthApiError;
  }

  return {
    code: "UNKNOWN_ERROR",
    message: "Nao foi possivel concluir o login.",
    statusCode: 500,
  };
}

export async function POST(request: Request) {
  const body = validateBody(await request.json().catch(() => null));

  if (body === null || body.email.length === 0 || body.password.length === 0) {
    return NextResponse.json(
      {
        code: "HTTP_ERROR",
        message: "Informe email e senha.",
      },
      { status: 400 },
    );
  }

  try {
    const auth = await loginWithApi(body);
    const response = NextResponse.json(
      {
        ok: true,
        redirectTo: DEFAULT_LOGIN_REDIRECT,
        user: auth.user,
      },
      { status: 200 },
    );

    persistAuthCookies(response.cookies, auth);
    return response;
  } catch (error) {
    const authError = normalizeError(error);

    return NextResponse.json(
      {
        code: authError.code,
        message: authError.message,
      },
      { status: authError.statusCode },
    );
  }
}
