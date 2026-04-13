function normalizeBase64Url(input: string): string {
  return input.replaceAll("-", "+").replaceAll("_", "/");
}

function decodeBase64Url(input: string): string | null {
  try {
    const normalized = normalizeBase64Url(input);
    return Buffer.from(normalized, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export type DecodedJwtPayload = {
  exp?: number;
  iat?: number;
  sub?: string;
  role?: "ADMIN" | "MANAGER" | string;
};

export function decodeJwtPayload(token: string): DecodedJwtPayload | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const payloadSegment = parts[1];

  if (typeof payloadSegment !== "string") {
    return null;
  }

  const decoded = decodeBase64Url(payloadSegment);

  if (decoded === null) {
    return null;
  }

  try {
    return JSON.parse(decoded) as DecodedJwtPayload;
  } catch {
    return null;
  }
}

export function getTokenExpirationDate(token: string): Date | null {
  const payload = decodeJwtPayload(token);

  if (typeof payload?.exp !== "number") {
    return null;
  }

  return new Date(payload.exp * 1000);
}

export function isTokenExpired(token: string, skewInSeconds = 15): boolean {
  const payload = decodeJwtPayload(token);

  if (typeof payload?.exp !== "number") {
    return true;
  }

  return payload.exp * 1000 <= Date.now() + skewInSeconds * 1000;
}
