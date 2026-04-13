import { describe, expect, it, beforeAll } from "vitest";
import { generateKeyPairSync } from "crypto";
import { AppException } from "../../domain/exceptions/app-exception";
import { Rs256JwtProvider } from "./rs256-jwt.provider";

let testPrivateKeyPem: string;
let testPublicKeyPem: string;

beforeAll(() => {
  const keyPair = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });
  testPrivateKeyPem = keyPair.privateKey;
  testPublicKeyPem = keyPair.publicKey;
});

function createProvider(options?: {
  issuer?: string;
  audience?: string;
  accessTokenExpiresIn?: string;
  privateKeyPem?: string;
  publicKeyPem?: string;
}) {
  return new Rs256JwtProvider({
    privateKey: options?.privateKeyPem ?? testPrivateKeyPem,
    publicKey: options?.publicKeyPem ?? testPublicKeyPem,
    issuer: options?.issuer ?? "issuer-test",
    audience: options?.audience ?? "audience-test",
    accessTokenExpiresIn: options?.accessTokenExpiresIn ?? "10m",
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe("Rs256JwtProvider", () => {
  it("signs and verifies a valid token", async () => {
    const provider = await createProvider();

    const token = await provider.sign({
      sub: "user-id-1",
      sessionId: "session-id-1",
      tokenVersion: 0,
      role: "ADMIN",
      iss: "issuer-test",
      aud: "audience-test",
    });

    const payload = await provider.verify(token);
    expect(payload.sub).toBe("user-id-1");
    expect(payload.sessionId).toBe("session-id-1");
    expect(payload.role).toBe("ADMIN");
  });

  it("throws TOKEN_EXPIRED for expired tokens", async () => {
    const provider = createProvider({ accessTokenExpiresIn: "1s" });
    const token = await provider.sign({
      sub: "user-id-1",
      sessionId: "session-id-1",
      tokenVersion: 0,
      role: "MANAGER",
      iss: "issuer-test",
      aud: "audience-test",
    });

    await sleep(2_000);

    await expect(provider.verify(token)).rejects.toMatchObject({
      code: "TOKEN_EXPIRED",
    } satisfies Partial<AppException>);
  }, 10_000);

  it("throws TOKEN_INVALID for invalid signature", async () => {
    const signerKeyPair = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    const verifierKeyPair = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    const signer = new Rs256JwtProvider({
      privateKey: signerKeyPair.privateKey,
      publicKey: signerKeyPair.publicKey,
      issuer: "issuer-test",
      audience: "audience-test",
      accessTokenExpiresIn: "10m",
    });
    const verifier = new Rs256JwtProvider({
      privateKey: verifierKeyPair.privateKey,
      publicKey: verifierKeyPair.publicKey,
      issuer: "issuer-test",
      audience: "audience-test",
      accessTokenExpiresIn: "10m",
    });
    const token = await signer.sign({
      sub: "user-id-1",
      sessionId: "session-id-1",
      tokenVersion: 0,
      role: "ADMIN",
      iss: "issuer-test",
      aud: "audience-test",
    });

    await expect(verifier.verify(token)).rejects.toMatchObject({
      code: "TOKEN_INVALID",
    } satisfies Partial<AppException>);
  });

  it("throws TOKEN_INVALID for wrong audience", async () => {
    const signerKeyPair = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    const verifierKeyPair = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    const signer = new Rs256JwtProvider({
      privateKey: signerKeyPair.privateKey,
      publicKey: signerKeyPair.publicKey,
      issuer: "issuer-test",
      audience: "audience-a",
      accessTokenExpiresIn: "10m",
    });
    const verifier = new Rs256JwtProvider({
      privateKey: verifierKeyPair.privateKey,
      publicKey: verifierKeyPair.publicKey,
      issuer: "issuer-test",
      audience: "audience-b",
      accessTokenExpiresIn: "10m",
    });

    const token = await signer.sign({
      sub: "user-id-1",
      sessionId: "session-id-1",
      tokenVersion: 0,
      role: "MANAGER",
      iss: "issuer-test",
      aud: "audience-a",
    });

    await expect(verifier.verify(token)).rejects.toMatchObject({
      code: "TOKEN_INVALID",
    } satisfies Partial<AppException>);
  });
});
