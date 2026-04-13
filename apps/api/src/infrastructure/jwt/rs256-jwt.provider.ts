import { AppException } from "../../domain/exceptions/app-exception";
import {
  AccessTokenPayload,
  parseAccessTokenPayload,
} from "../../domain/auth/auth.types";
import { IJwtProvider } from "../../domain/auth/ijwt-provider";
import {
  decodeJwt,
  errors as joseErrors,
  importPKCS8,
  importSPKI,
  jwtVerify,
  SignJWT,
} from "jose";

export type Rs256JwtProviderOptions = {
  privateKey: string;
  publicKey: string;
  issuer: string;
  audience: string;
  accessTokenExpiresIn: string;
};

function normalizePem(pem: string): string {
  return pem.replace(/\\n/g, "\n").trim();
}

export class Rs256JwtProvider implements IJwtProvider {
  private readonly privateKeyPromise: Promise<Awaited<ReturnType<typeof importPKCS8>>>;
  private readonly publicKeyPromise: Promise<Awaited<ReturnType<typeof importSPKI>>>;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly accessTokenExpiresIn: string;

  public constructor(options: Rs256JwtProviderOptions) {
    this.privateKeyPromise = importPKCS8(
      normalizePem(options.privateKey),
      "RS256",
    );
    this.publicKeyPromise = importSPKI(normalizePem(options.publicKey), "RS256");
    this.issuer = options.issuer;
    this.audience = options.audience;
    this.accessTokenExpiresIn = options.accessTokenExpiresIn;
  }

  public async sign(payload: AccessTokenPayload, expiresIn?: string): Promise<string> {
    const parsedPayload = parseAccessTokenPayload(payload);
    const privateKey = await this.privateKeyPromise;

    return new SignJWT({
      sub: parsedPayload.sub,
      sessionId: parsedPayload.sessionId,
      tokenVersion: parsedPayload.tokenVersion,
      role: parsedPayload.role,
    })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setIssuedAt()
      .setExpirationTime(expiresIn ?? this.accessTokenExpiresIn)
      .sign(privateKey);
  }

  public async verify(token: string): Promise<AccessTokenPayload> {
    try {
      const publicKey = await this.publicKeyPromise;
      const { payload } = await jwtVerify(token, publicKey, {
        algorithms: ["RS256"],
        issuer: this.issuer,
        audience: this.audience,
      });

      return parseAccessTokenPayload(payload);
    } catch (error: unknown) {
      if (error instanceof joseErrors.JWTExpired) {
        throw new AppException("TOKEN_EXPIRED", "Token expired", 401);
      }

      throw new AppException("TOKEN_INVALID", "Token invalid", 401);
    }
  }

  public decode(token: string): AccessTokenPayload | null {
    try {
      const payload = decodeJwt(token);
      return parseAccessTokenPayload(payload);
    } catch {
      return null;
    }
  }
}
