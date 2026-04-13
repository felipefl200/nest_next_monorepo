import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { exportSPKI, generateKeyPair, SignJWT } from "jose";
import { verifyJwt } from "./verify-jwt";

const ORIGINAL_ENV = {
  JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
  JWT_ISSUER: process.env.JWT_ISSUER,
  JWT_AUDIENCE: process.env.JWT_AUDIENCE,
};

async function createSignedToken(options?: {
  issuer?: string;
  audience?: string;
  expirationTime?: string | number | Date;
}) {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const publicKeyPem = await exportSPKI(publicKey);

  const token = await new SignJWT({
    sub: "user-1",
    sessionId: "session-1",
    tokenVersion: 0,
    role: "ADMIN",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(options?.issuer ?? "issuer-test")
    .setAudience(options?.audience ?? "audience-test")
    .setIssuedAt()
    .setExpirationTime(options?.expirationTime ?? "15m")
    .sign(privateKey);

  return { token, publicKeyPem };
}

describe("verifyJwt", () => {
  beforeEach(() => {
    process.env.JWT_ISSUER = "issuer-test";
    process.env.JWT_AUDIENCE = "audience-test";
  });

  afterEach(() => {
    process.env.JWT_PUBLIC_KEY = ORIGINAL_ENV.JWT_PUBLIC_KEY;
    process.env.JWT_ISSUER = ORIGINAL_ENV.JWT_ISSUER;
    process.env.JWT_AUDIENCE = ORIGINAL_ENV.JWT_AUDIENCE;
  });

  it("accepts a valid token", async () => {
    const { token, publicKeyPem } = await createSignedToken();
    process.env.JWT_PUBLIC_KEY = publicKeyPem;

    await expect(verifyJwt(token)).resolves.toBe(true);
  });

  it("rejects a token with a forged signature", async () => {
    const trustedKeys = await createSignedToken();
    const forgedKeys = await createSignedToken();
    process.env.JWT_PUBLIC_KEY = trustedKeys.publicKeyPem;

    await expect(verifyJwt(forgedKeys.token)).resolves.toBe(false);
  });

  it("rejects an expired token", async () => {
    const { token, publicKeyPem } = await createSignedToken({
      expirationTime: Math.floor(Date.now() / 1000) - 30,
    });
    process.env.JWT_PUBLIC_KEY = publicKeyPem;

    await expect(verifyJwt(token)).resolves.toBe(false);
  });

  it("rejects a token with the wrong issuer", async () => {
    const { token, publicKeyPem } = await createSignedToken({
      issuer: "wrong-issuer",
    });
    process.env.JWT_PUBLIC_KEY = publicKeyPem;

    await expect(verifyJwt(token)).resolves.toBe(false);
  });

  it("rejects an arbitrary string", async () => {
    const { publicKeyPem } = await createSignedToken();
    process.env.JWT_PUBLIC_KEY = publicKeyPem;

    await expect(verifyJwt("not-a-jwt")).resolves.toBe(false);
  });

  it("fails closed when JWT_PUBLIC_KEY is invalid", async () => {
    const { token } = await createSignedToken();
    process.env.JWT_PUBLIC_KEY = "invalid-public-key";

    await expect(verifyJwt(token)).resolves.toBe(false);
  });
});
