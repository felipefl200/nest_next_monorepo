import { IHashProvider } from "../../domain/auth/ihash-provider";
import { IJwtProvider } from "../../domain/auth/ijwt-provider";
import { IRateLimitStore } from "../../domain/rate-limit/irate-limit-store";
import { IAuthSessionRepository } from "../../domain/auth/auth-session.repository";

export type AuthUseCaseDependencies = {
  jwtProvider: IJwtProvider;
  hashProvider: IHashProvider;
  rateLimitStore: IRateLimitStore;
  authSessionRepository: IAuthSessionRepository;
  jwtIssuer: string;
  jwtAudience: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
};
