import { ExecutionContext } from "@nestjs/common";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { AUTH_SESSION_REPOSITORY, JWT_PROVIDER } from "../../domain/tokens";

import { UnauthorizedException } from "../../domain/exceptions/unauthorized.exception";
import { IJwtProvider } from "../../domain/auth/ijwt-provider";
import { IAuthSessionRepository, AuthSessionWithUser } from "../../domain/auth/auth-session.repository";
import { AccessTokenPayload } from "../../domain/auth/auth.types";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard;
  let jwtProvider: IJwtProvider;
  let authSessionRepository: IAuthSessionRepository;
  let mockReflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    jwtProvider = {
      sign: vi.fn(),
      verify: vi.fn(),
      decode: vi.fn(),
    };

    authSessionRepository = {
      findUserByEmail: vi.fn(),
      findUserById: vi.fn(),
      findCurrentUserById: vi.fn(async () => null),
      findSessionById: vi.fn(),
      updateCurrentUserProfile: vi.fn(async () => {
        throw new Error("not implemented");
      }),
      updateCurrentUserPassword: vi.fn(async () => undefined),
      createSession: vi.fn(),
      revokeSessionById: vi.fn(),
      revokeAllSessionsByUserId: vi.fn(),
      revokeOtherSessionsByUserId: vi.fn(),
      incrementUserTokenVersion: vi.fn(),
    };

    mockReflector = { getAllAndOverride: vi.fn() };

    guard = new JwtAuthGuard(
      mockReflector as any,
      jwtProvider,
      authSessionRepository,
    );
  });

  function createMockExecutionContext(headers: Record<string, string>): ExecutionContext {
    const request = { headers };
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: vi.fn(),
        getNext: vi.fn(),
      }),
    } as unknown as ExecutionContext;
  }

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should return true for public routes", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockExecutionContext({});
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it("should throw UnauthorizedException if token is missing", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockExecutionContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toMatchObject({ code: "TOKEN_MISSING" });
  });

  it("should throw TOKEN_INVALID if jwtProvider throws", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockExecutionContext({ authorization: "Bearer invalid_token" });
    vi.spyOn(jwtProvider, "verify").mockRejectedValue(new Error("Generic error"));

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toMatchObject({ code: "TOKEN_INVALID" });
  });

  it("should throw original AppException if jwtProvider throws AppException", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockExecutionContext({ authorization: "Bearer expired_token" });
    vi.spyOn(jwtProvider, "verify").mockRejectedValue(new UnauthorizedException("TOKEN_EXPIRED", "Token expired"));

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toMatchObject({ code: "TOKEN_EXPIRED" });
  });

  it("should throw SESSION_NOT_FOUND if session does not exist", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockExecutionContext({ authorization: "Bearer valid_token" });

    const payload: AccessTokenPayload = {
      sub: "user-1",
      sessionId: "session-1",
      tokenVersion: 1,
      role: "ADMIN",
      iss: "ecommerce",
      aud: "ecommerce-admin",
    };

    vi.spyOn(jwtProvider, "verify").mockResolvedValue(payload);
    vi.spyOn(authSessionRepository, "findSessionById").mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toMatchObject({ code: "SESSION_NOT_FOUND" });
  });

  it("should throw SESSION_REVOKED if session has revokedAt", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockExecutionContext({ authorization: "Bearer valid_token" });

    const payload: AccessTokenPayload = {
      sub: "user-1",
      sessionId: "session-1",
      tokenVersion: 1,
      role: "ADMIN",
      iss: "ecommerce",
      aud: "ecommerce-admin",
    };

    vi.spyOn(jwtProvider, "verify").mockResolvedValue(payload);
    vi.spyOn(authSessionRepository, "findSessionById").mockResolvedValue({
      id: "session-1",
      revokedAt: new Date(),
      user: { tokenVersion: 1 }
    } as AuthSessionWithUser);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toMatchObject({ code: "SESSION_REVOKED" });
  });

  it("should throw TOKEN_VERSION_MISMATCH if tokenVersion is different", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockExecutionContext({ authorization: "Bearer valid_token" });

    const payload: AccessTokenPayload = {
      sub: "user-1",
      sessionId: "session-1",
      tokenVersion: 1,
      role: "ADMIN",
      iss: "ecommerce",
      aud: "ecommerce-admin",
    };

    vi.spyOn(jwtProvider, "verify").mockResolvedValue(payload);
    vi.spyOn(authSessionRepository, "findSessionById").mockResolvedValue({
      id: "session-1",
      revokedAt: null,
      user: { tokenVersion: 2 }
    } as AuthSessionWithUser);

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toMatchObject({ code: "TOKEN_VERSION_MISMATCH" });
  });

  it("should attach user to request and return true if validation passes", async () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockExecutionContext({ authorization: "Bearer valid_token" });

    const payload: AccessTokenPayload = {
      sub: "user-1",
      sessionId: "session-1",
      tokenVersion: 1,
      role: "ADMIN",
      iss: "ecommerce",
      aud: "ecommerce-admin",
    };

    vi.spyOn(jwtProvider, "verify").mockResolvedValue(payload);
    vi.spyOn(authSessionRepository, "findSessionById").mockResolvedValue({
      id: "session-1",
      revokedAt: null,
      user: { tokenVersion: 1 }
    } as AuthSessionWithUser);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(context.switchToHttp().getRequest()["user"]).toEqual(payload);
  });
});
