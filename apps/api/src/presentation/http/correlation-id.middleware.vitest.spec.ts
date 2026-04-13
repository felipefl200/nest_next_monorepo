import { describe, expect, it, vi } from "vitest";
import { attachCorrelationId } from "./correlation-id.middleware";

type TestRequest = {
  headers: Record<string, string>;
  correlationId?: string;
};

describe("attachCorrelationId", () => {
  it("uses the x-request-id header when provided", () => {
    const request: TestRequest = {
      headers: {
        "x-request-id": "meu-id-de-teste-123",
      },
    };
    const response = {
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    attachCorrelationId(request, response, next);

    expect(request.correlationId).toBe("meu-id-de-teste-123");
    expect(response.setHeader).toHaveBeenCalledWith(
      "x-request-id",
      "meu-id-de-teste-123",
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("generates a UUID when the header is missing", () => {
    const request: TestRequest = {
      headers: {},
    };
    const response = {
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    attachCorrelationId(request, response, next);

    expect(request.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      "x-request-id",
      request.correlationId,
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
