import { AccessTokenPayload } from "./auth.types";

export interface IJwtProvider {
  sign(payload: AccessTokenPayload, expiresIn?: string): Promise<string>;
  verify(token: string): Promise<AccessTokenPayload>;
  decode(token: string): AccessTokenPayload | null;
}
