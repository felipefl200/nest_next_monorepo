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
        // On Next.js 16+, proxy is a fast edge gate. When only the refresh token
        // exists, prefer redirecting to the BFF refresh route instead of letting
        // each protected page duplicate refresh orchestration.
        return NextResponse.redirect(buildRefreshUrl(request));
      }

      return NextResponse.redirect(new URL("/login", request.url));
    }

    const isAuthenticated = await isAuthenticatedRequest(request);

    if (!isAuthenticated) {
      // Proxy is intentionally not the source of truth for authorization.
      // It only performs a cheap signature/claims check to optimize navigation.
      // Final enforcement stays in server components, route handlers, and Nest guards.
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
