import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  buildRefreshUrl,
  hasRefreshToken,
  isAuthenticatedRequest,
} from "@/src/services/auth/request-auth";

const PUBLIC_ROUTES = new Set(["/login"]);

function isProtectedRoute(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = isAuthenticatedRequest(request);
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  if (isProtectedRoute(pathname) && !isAuthenticated) {
    if (hasRefreshToken(request)) {
      return NextResponse.redirect(buildRefreshUrl(request));
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPublicRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
