import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { UserRole } from "../../domain/auth/auth.types";
import { ForbiddenException } from "../../domain/exceptions/forbidden.exception";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException("INSUFFICIENT_PERMISSIONS", "User does not have required permissions");
    }

    const hasRole = requiredRoles.includes(user.role as UserRole);

    if (!hasRole) {
      throw new ForbiddenException("INSUFFICIENT_PERMISSIONS", "User does not have required permissions");
    }

    return true;
  }
}
