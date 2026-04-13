export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: "ADMIN" | "MANAGER";
};

export type CurrentUserProfile = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER";
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthTokensResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  sessionId: string;
};

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "USER_INACTIVE"
  | "REFRESH_TOKEN_INVALID"
  | "REFRESH_TOKEN_REUSE_DETECTED"
  | "TOKEN_VERSION_MISMATCH"
  | "AUTH_LOGIN_FAILED"
  | "AUTH_REFRESH_FAILED"
  | "HTTP_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export type AuthApiError = {
  code: AuthErrorCode;
  message: string;
  statusCode: number;
};

export type SessionSnapshot = {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: string | null;
  user: AuthUser | null;
};
