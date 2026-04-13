import { randomUUID } from "node:crypto";

type RequestWithCorrelationId = {
  headers: Record<string, string | string[] | undefined>;
  correlationId?: string;
};

type ResponseWithSetHeader = {
  setHeader(name: string, value: string): void;
};

type NextFunction = () => void;

function normalizeHeaderValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    const [firstValue] = value;
    return typeof firstValue === "string" && firstValue.length > 0 ? firstValue : null;
  }

  return null;
}

export function attachCorrelationId(
  request: RequestWithCorrelationId,
  response: ResponseWithSetHeader,
  next: NextFunction,
): void {
  const correlationId =
    normalizeHeaderValue(request.headers["x-request-id"]) ?? randomUUID();

  request.correlationId = correlationId;
  response.setHeader("x-request-id", correlationId);
  next();
}
