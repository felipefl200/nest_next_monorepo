import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiEnv } from "@repo/config";
import { AppException } from "../../domain/exceptions/app-exception";
import { ConflictException } from "../../domain/exceptions/conflict.exception";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { NotFoundException } from "../../domain/exceptions/not-found.exception";
import { RateLimitException } from "../../domain/exceptions/rate-limit.exception";
import { UnauthorizedException } from "../../domain/exceptions/unauthorized.exception";
import { describe, expect, it, vi } from "vitest";
import { GlobalExceptionFilter } from "./global-exception.filter";

type MockResponse = {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

function createHost(path = "/test/path") {
  const response: MockResponse = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  const request = { url: path };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
      getNext: () => null,
    }),
    getType: () => "http",
    getArgByIndex: () => null,
    getArgs: () => [],
    switchToRpc: () => ({ getContext: () => null, getData: () => null }),
    switchToWs: () => ({ getClient: () => null, getData: () => null }),
  } as unknown as ArgumentsHost;

  return { host, response };
}

function createFilter() {
  const configService = {
    get: () => "test",
  } as unknown as ConfigService<ApiEnv, true>;

  return new GlobalExceptionFilter(configService);
}

describe("GlobalExceptionFilter", () => {
  it("maps app exceptions to expected HTTP status codes", () => {
    const cases: ReadonlyArray<{ exception: AppException; statusCode: number; code: string }> = [
      { exception: new UnauthorizedException("TOKEN_INVALID", "Token invalid"), statusCode: 401, code: "TOKEN_INVALID" },
      { exception: new ForbiddenException("INSUFFICIENT_PERMISSIONS", "Forbidden"), statusCode: 403, code: "INSUFFICIENT_PERMISSIONS" },
      { exception: new NotFoundException("RESOURCE_NOT_FOUND", "Not found"), statusCode: 404, code: "RESOURCE_NOT_FOUND" },
      { exception: new ConflictException("RESOURCE_CONFLICT", "Conflict"), statusCode: 409, code: "RESOURCE_CONFLICT" },
      { exception: new RateLimitException("RATE_LIMIT_EXCEEDED", "Too many requests"), statusCode: 429, code: "RATE_LIMIT_EXCEEDED" },
    ];

    for (const testCase of cases) {
      const filter = createFilter();
      const { host, response } = createHost();

      filter.catch(testCase.exception, host);

      expect(response.status).toHaveBeenCalledWith(testCase.statusCode);
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: testCase.code,
          statusCode: testCase.statusCode,
          path: "/test/path",
        }),
      );
    }
  });

  it("maps HttpException to ApiError contract", () => {
    const filter = createFilter();
    const { host, response } = createHost("/http-exception");
    const exception = new HttpException(
      { code: "BAD_INPUT", message: "Invalid input data" },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        code: "BAD_INPUT",
        message: "Invalid input data",
        path: "/http-exception",
      }),
    );
  });

  it("maps unknown errors to INTERNAL_SERVER_ERROR", () => {
    const filter = createFilter();
    const { host, response } = createHost("/unknown");

    filter.catch(new Error("boom"), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        path: "/unknown",
      }),
    );
  });
});
