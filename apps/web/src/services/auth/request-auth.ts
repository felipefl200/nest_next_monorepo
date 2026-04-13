import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAMES, DEFAULT_LOGIN_REDIRECT } from "./constants";
import { verifyJwt } from "./verify-jwt";

export async function isAuthenticatedRequest(request: NextRequest): Promise<boolean> {
  const accessToken = request.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value;

  if (typeof accessToken !== "string" || accessToken.length === 0) {
    return false;
  }

  return verifyJwt(accessToken);
}

export function hasRefreshToken(request: NextRequest): boolean {
  const refreshToken = request.cookies.get(AUTH_COOKIE_NAMES.refreshToken)?.value;
  return typeof refreshToken === "string" && refreshToken.length > 0;
}

export function buildRefreshUrl(request: NextRequest): URL {
  const refreshUrl = new URL("/api/auth/refresh", request.url);
  const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  refreshUrl.searchParams.set("returnTo", returnTo || DEFAULT_LOGIN_REDIRECT);
  return refreshUrl;
}
