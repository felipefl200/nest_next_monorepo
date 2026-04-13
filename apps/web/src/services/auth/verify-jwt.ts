import { importSPKI, jwtVerify } from "jose";

let cachedPublicKeyPem: string | null = null;
let cachedPublicKeyPromise: ReturnType<typeof importSPKI> | null = null;

function normalizePem(value: string): string {
  return value.replaceAll("\\n", "\n").trim();
}

function getRequiredEnv(name: "JWT_PUBLIC_KEY" | "JWT_ISSUER" | "JWT_AUDIENCE"): string | null {
  const value = process.env[name];
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function getPublicKey() {
  const publicKeyPem = getRequiredEnv("JWT_PUBLIC_KEY");

  if (publicKeyPem === null) {
    cachedPublicKeyPem = null;
    cachedPublicKeyPromise = null;
    return null;
  }

  if (cachedPublicKeyPem !== publicKeyPem || cachedPublicKeyPromise === null) {
    cachedPublicKeyPem = publicKeyPem;
    cachedPublicKeyPromise = importSPKI(normalizePem(publicKeyPem), "RS256");
  }

  return cachedPublicKeyPromise;
}

export async function verifyJwt(token: string): Promise<boolean> {
  const issuer = getRequiredEnv("JWT_ISSUER");
  const audience = getRequiredEnv("JWT_AUDIENCE");
  
  if (issuer === null || audience === null) {
    return false;
  }

  try {
    const publicKey = await getPublicKey();

    if (publicKey === null) {
      return false;
    }

    await jwtVerify(token, publicKey, {
      algorithms: ["RS256"],
      issuer,
      audience,
    });

    return true;
  } catch {
    return false;
  }
}
