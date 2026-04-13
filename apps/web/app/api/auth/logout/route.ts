import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logoutWithApi } from "@/src/services/auth/api";
import { AUTH_COOKIE_NAMES } from "@/src/services/auth/constants";
import { clearAuthCookies } from "@/src/services/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const response = NextResponse.json({ ok: true }, { status: 200 });

  if (typeof accessToken === "string" && accessToken.length > 0) {
    try {
      await logoutWithApi(accessToken);
    } catch {
      // Keep logout idempotent on the frontend even if the API token is already invalid.
    }
  }

  clearAuthCookies(response.cookies);
  return response;
}
