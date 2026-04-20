import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { refreshWithApi } from "@/src/services/auth/api";
import { AUTH_COOKIE_NAMES, DEFAULT_LOGIN_REDIRECT } from "@/src/services/auth/constants";
import { clearAuthCookies, persistAuthCookies } from "@/src/services/auth/session";

async function refreshSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(AUTH_COOKIE_NAMES.refreshToken)?.value;

  if (typeof refreshToken !== "string" || refreshToken.length === 0) {
    throw new Error("Missing refresh token");
  }

  return refreshWithApi(refreshToken);
}

export async function POST() {
  try {
    const auth = await refreshSession();
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
  } catch {
    const response = NextResponse.json(
      {
        code: "REFRESH_TOKEN_INVALID",
        message: "Sua sessao expirou. Faca login novamente.",
      },
      { status: 401 },
    );

    clearAuthCookies(response.cookies);
    return response;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const returnTo = requestUrl.searchParams.get("returnTo") || DEFAULT_LOGIN_REDIRECT;

  try {
    // GET exists for browser navigations triggered by proxy/server redirects.
    // The POST variant is used by client-side flows that expect a JSON contract.
    const auth = await refreshSession();
    const response = NextResponse.redirect(new URL(returnTo, request.url));
    persistAuthCookies(response.cookies, auth);
    return response;
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    clearAuthCookies(response.cookies);
    return response;
  }
}
