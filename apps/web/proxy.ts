import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  buildRefreshUrl,
  hasAccessToken,
  hasRefreshToken,
  isAuthenticatedRequest,
} from "@/src/services/auth/request-auth";

const PUBLIC_ROUTES = new Set(["/login"]);

function isProtectedRoute(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);
  const hasAccess = hasAccessToken(request);
  const hasRefresh = hasRefreshToken(request);

  if (isProtectedRoute(pathname)) {
    if (!hasAccess) {
      if (hasRefresh) {
        return NextResponse.redirect(buildRefreshUrl(request));
      }

      return NextResponse.redirect(new URL("/login", request.url));
    }

    const isAuthenticated = await isAuthenticatedRequest(request);

    if (!isAuthenticated) {
      // Avoid redirecting an App Router navigation to an API route from the proxy.
      // The server page and BFF route handlers still enforce auth against the API.
      return NextResponse.next();
    }
  }

  if (isPublicRoute && hasAccess) {
    const isAuthenticated = await isAuthenticatedRequest(request);

    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
