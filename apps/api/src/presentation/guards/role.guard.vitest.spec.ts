import { ExecutionContext } from "@nestjs/common";
import { RoleGuard } from "./role.guard";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("RoleGuard", () => {
  let guard: RoleGuard;
  let mockReflector: { getAllAndOverride: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockReflector = { getAllAndOverride: vi.fn() };
    guard = new RoleGuard(mockReflector as any);
  });

  function createMockExecutionContext(user: any): ExecutionContext {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should return true for public routes", () => {
    mockReflector.getAllAndOverride.mockImplementation((key) => {
      if (key === "isPublic") return true;
      return null;
    });

    const context = createMockExecutionContext(null);
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should return true if no roles are required", () => {
    mockReflector.getAllAndOverride.mockImplementation((key) => {
      if (key === "isPublic") return false;
      if (key === "roles") return [];
      return null;
    });

    const context = createMockExecutionContext(null);
    expect(guard.canActivate(context)).toBe(true);
  });

  it("should throw ForbiddenException if user is not attached to request", () => {
    mockReflector.getAllAndOverride.mockImplementation((key) => {
      if (key === "isPublic") return false;
      if (key === "roles") return ["ADMIN"];
      return null;
    });

    const context = createMockExecutionContext(null);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    try {
      guard.canActivate(context);
    } catch (e: any) {
      expect(e.code).toBe("INSUFFICIENT_PERMISSIONS");
    }
  });

  it("should throw ForbiddenException if user role does not match required roles", () => {
    mockReflector.getAllAndOverride.mockImplementation((key) => {
      if (key === "isPublic") return false;
      if (key === "roles") return ["ADMIN"];
      return null;
    });

    const context = createMockExecutionContext({ role: "MANAGER" });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    try {
      guard.canActivate(context);
    } catch (e: any) {
      expect(e.code).toBe("INSUFFICIENT_PERMISSIONS");
    }
  });

  it("should return true if user role matches one of required roles", () => {
    mockReflector.getAllAndOverride.mockImplementation((key) => {
      if (key === "isPublic") return false;
      if (key === "roles") return ["ADMIN", "MANAGER"];
      return null;
    });

    const context = createMockExecutionContext({ role: "MANAGER" });
    expect(guard.canActivate(context)).toBe(true);
  });
});
