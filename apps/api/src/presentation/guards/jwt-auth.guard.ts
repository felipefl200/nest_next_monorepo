import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { AUTH_SESSION_REPOSITORY, JWT_PROVIDER } from "../../domain/tokens";
import type { IJwtProvider } from "../../domain/auth/ijwt-provider";
import type { IAuthSessionRepository } from "../../domain/auth/auth-session.repository";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { UnauthorizedException } from "../../domain/exceptions/unauthorized.exception";
import { AppException } from "../../domain/exceptions/app-exception";
import type { AccessTokenPayload } from "../../domain/auth/auth.types";

type AuthenticatedRequest = Request & {
  user?: AccessTokenPayload;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(JWT_PROVIDER) private readonly jwtProvider: IJwtProvider,
    @Inject(AUTH_SESSION_REPOSITORY) private readonly authSessionRepository: IAuthSessionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException("TOKEN_MISSING", "Token is missing");
    }

    try {
      const payload = await this.jwtProvider.verify(token);

      const session = await this.authSessionRepository.findSessionById(payload.sessionId);

      if (!session) {
        throw new UnauthorizedException("SESSION_NOT_FOUND", "Session not found");
      }

      if (session.revokedAt) {
        throw new UnauthorizedException("SESSION_REVOKED", "Session revoked");
      }

      if (session.user.tokenVersion !== payload.tokenVersion) {
        throw new UnauthorizedException("TOKEN_VERSION_MISMATCH", "Token version mismatch");
      }

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw new UnauthorizedException("TOKEN_INVALID", "Invalid token");
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
