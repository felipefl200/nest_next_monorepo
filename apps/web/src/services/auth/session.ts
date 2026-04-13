import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUserProfileWithApi } from "./api";
import { AUTH_COOKIE_NAMES } from "./constants";
import { decodeJwtPayload, getTokenExpirationDate, isTokenExpired } from "./jwt";
import type {
  AuthApiError,
  AuthTokensResponse,
  AuthUser,
  CurrentUserProfile,
  SessionSnapshot,
} from "./types";

function deriveUserFromAccessToken(accessToken: string): AuthUser | null {
  const payload = decodeJwtPayload(accessToken);

  if (
    typeof payload?.sub !== "string" ||
    (payload.role !== "ADMIN" && payload.role !== "MANAGER")
  ) {
    return null;
  }

  return {
    id: payload.sub,
    email: null,
    name: null,
    role: payload.role,
  };
}

function isSecureCookie(): boolean {
  return process.env.NODE_ENV === "production";
}

export function persistAuthCookies(
  cookieStore: {
    set: (
      name: string,
      value: string,
      options?: {
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: "lax" | "strict";
        path?: string;
        expires?: Date;
      },
    ) => void;
  },
  auth: AuthTokensResponse,
): void {
  const accessTokenExpiresAt = getTokenExpirationDate(auth.accessToken);
  const refreshTokenExpiresAt = getTokenExpirationDate(auth.refreshToken);

  cookieStore.set(AUTH_COOKIE_NAMES.accessToken, auth.accessToken, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "lax",
    path: "/",
    expires: accessTokenExpiresAt ?? undefined,
  });

  cookieStore.set(AUTH_COOKIE_NAMES.refreshToken, auth.refreshToken, {
    httpOnly: true,
    secure: isSecureCookie(),
    sameSite: "strict",
    path: "/",
    expires: refreshTokenExpiresAt ?? undefined,
  });
}

export function clearAuthCookies(cookieStore: {
  delete: (name: string) => void;
}): void {
  cookieStore.delete(AUTH_COOKIE_NAMES.accessToken);
  cookieStore.delete(AUTH_COOKIE_NAMES.refreshToken);
}

export async function getSessionSnapshot(): Promise<SessionSnapshot> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value ?? null;
  const refreshToken = cookieStore.get(AUTH_COOKIE_NAMES.refreshToken)?.value ?? null;

  if (accessToken === null || isTokenExpired(accessToken)) {
    return {
      isAuthenticated: false,
      accessToken,
      refreshToken,
      accessTokenExpiresAt: null,
      user: null,
    };
  }

  const user = deriveUserFromAccessToken(accessToken);

  if (user === null) {
    return {
      isAuthenticated: false,
      accessToken,
      refreshToken,
      accessTokenExpiresAt: null,
      user: null,
    };
  }

  return {
    isAuthenticated: true,
    accessToken,
    refreshToken,
    accessTokenExpiresAt: getTokenExpirationDate(accessToken)?.toISOString() ?? null,
    user,
  };
}

export async function requireSession(): Promise<SessionSnapshot> {
  const session = await getSessionSnapshot();

  if (!session.isAuthenticated) {
    redirect("/login");
  }

  return session;
}

function isUnauthorizedAuthError(error: unknown): error is AuthApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    (error as { statusCode?: unknown }).statusCode === 401
  );
}

export async function getCurrentUserProfile(
  returnTo: string,
): Promise<CurrentUserProfile> {
  const session = await requireSession();

  if (session.accessToken === null) {
    redirect("/login");
  }

  try {
    return await getCurrentUserProfileWithApi(session.accessToken);
  } catch (error) {
    if (isUnauthorizedAuthError(error)) {
      if (session.refreshToken !== null) {
        redirect(`/api/auth/refresh?returnTo=${encodeURIComponent(returnTo)}`);
      }

      redirect("/login");
    }

    throw error;
  }
}
