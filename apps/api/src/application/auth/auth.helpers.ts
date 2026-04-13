import { randomUUID } from "node:crypto";
import { parseDurationToMs } from "../common/parse-duration";
import {
  AuthTokensResult,
  createTokenPayload,
} from "../../domain/auth/auth-tokens";
import { AuthUseCaseDependencies } from "./auth.use-case.dependencies";
import { AuthUser } from "../../domain/auth/auth-session.repository";
import { RateLimitException } from "../../domain/exceptions/rate-limit.exception";

export async function issueAuthTokens(
  deps: AuthUseCaseDependencies,
  params: {
    user: AuthUser;
    userAgent: string | null;
    ipAddress: string | null;
  },
): Promise<AuthTokensResult> {
  const sessionId = randomUUID();
  const accessPayload = createTokenPayload({
    userId: params.user.id,
    sessionId,
    tokenVersion: params.user.tokenVersion,
    role: params.user.role,
    issuer: deps.jwtIssuer,
    audience: deps.jwtAudience,
  });

  const accessToken = await deps.jwtProvider.sign(
    accessPayload,
    deps.accessTokenExpiresIn,
  );
  const refreshToken = await deps.jwtProvider.sign(
    accessPayload,
    deps.refreshTokenExpiresIn,
  );
  const refreshTokenHash = await deps.hashProvider.hash(refreshToken);
  const refreshTokenTtlMs = parseDurationToMs(deps.refreshTokenExpiresIn);
  const expiresAt = new Date(Date.now() + refreshTokenTtlMs);

  await deps.authSessionRepository.createSession({
    id: sessionId,
    userId: params.user.id,
    refreshTokenHash,
    userAgent: params.userAgent,
    ipAddress: params.ipAddress,
    expiresAt,
  });

  return {
    accessToken,
    refreshToken,
    sessionId,
    user: {
      id: params.user.id,
      email: params.user.email,
      name: params.user.name,
      role: params.user.role,
    },
  };
}

export async function validateRateLimit(
  deps: AuthUseCaseDependencies,
  key: string,
  maxRequests: number,
): Promise<void> {
  const count = await deps.rateLimitStore.increment(key, 60);
  if (count > maxRequests) {
    throw new RateLimitException("RATE_LIMIT_EXCEEDED", "Too many requests");
  }
}
