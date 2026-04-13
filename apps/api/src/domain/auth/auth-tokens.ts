import { AccessTokenPayload, UserRole } from "./auth.types";

export type AuthUserView = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type AuthTokensResult = {
  accessToken: string;
  refreshToken: string;
  user: AuthUserView;
  sessionId: string;
};

export function createTokenPayload(input: {
  userId: string;
  sessionId: string;
  tokenVersion: number;
  role: UserRole;
  issuer: string;
  audience: string;
}): AccessTokenPayload {
  return {
    sub: input.userId,
    sessionId: input.sessionId,
    tokenVersion: input.tokenVersion,
    role: input.role,
    iss: input.issuer,
    aud: input.audience,
  };
}
