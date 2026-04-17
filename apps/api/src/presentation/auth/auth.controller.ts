import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  UnauthorizedException as NestUnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { LoginUseCase } from "../../application/auth/login.use-case";
import { RefreshSessionUseCase } from "../../application/auth/refresh-session.use-case";
import { LogoutUseCase } from "../../application/auth/logout.use-case";
import { LogoutAllUseCase } from "../../application/auth/logout-all.use-case";
import { GetCurrentUserProfileUseCase } from "../../application/auth/get-current-user-profile.use-case";
import { GetOwnAccountProfileUseCase } from "../../application/auth/get-own-account-profile.use-case";
import { UpdateOwnProfileUseCase } from "../../application/auth/update-own-profile.use-case";
import { ChangeOwnPasswordUseCase } from "../../application/auth/change-own-password.use-case";
import type { AccessTokenPayload } from "../../domain/auth/auth.types";
import { Public } from "../decorators/public.decorator";

type LoginBody = {
  email: string;
  password: string;
};

type RefreshBody = {
  refreshToken: string;
};

type AuthenticatedRequest = Request & {
  user: AccessTokenPayload;
};

@Controller("auth")
export class AuthController {
  public constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly logoutAllUseCase: LogoutAllUseCase,
    private readonly getCurrentUserProfileUseCase: GetCurrentUserProfileUseCase,
    private readonly getOwnAccountProfileUseCase: GetOwnAccountProfileUseCase,
    private readonly updateOwnProfileUseCase: UpdateOwnProfileUseCase,
    private readonly changeOwnPasswordUseCase: ChangeOwnPasswordUseCase,
  ) {}

  @Public()
  @Post("login")
  public async login(@Body() body: LoginBody, @Req() request: Request) {
    return this.loginUseCase.execute({
      email: body.email,
      password: body.password,
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"] ?? undefined,
    });
  }

  @Public()
  @Post("refresh")
  public async refresh(@Body() body: RefreshBody, @Req() request: Request) {
    return this.refreshSessionUseCase.execute({
      refreshToken: body.refreshToken,
      ipAddress: request.ip,
      userAgent: request.headers["user-agent"] ?? undefined,
    });
  }

  @Get("me")
  public async getCurrentUserProfile(@Req() request: AuthenticatedRequest) {
    return this.getCurrentUserProfileUseCase.execute(request.user.sub);
  }

  @Get("account")
  public async getOwnAccount(@Req() request: AuthenticatedRequest) {
    return this.getOwnAccountProfileUseCase.execute(request.user.sub);
  }

  @Patch("account")
  public async updateOwnAccount(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const payload = typeof body === "object" && body !== null ? body : {};

    return this.updateOwnProfileUseCase.execute(request.user.sub, {
      name: String((payload as Record<string, unknown>).name ?? ""),
      email: String((payload as Record<string, unknown>).email ?? ""),
      currentPassword: String((payload as Record<string, unknown>).currentPassword ?? ""),
    });
  }

  @Post("account/change-password")
  public async changeOwnPassword(@Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const payload = typeof body === "object" && body !== null ? body : {};

    return this.changeOwnPasswordUseCase.execute({
      userId: request.user.sub,
      currentSessionId: request.user.sessionId,
      payload: {
        currentPassword: String((payload as Record<string, unknown>).currentPassword ?? ""),
        newPassword: String((payload as Record<string, unknown>).newPassword ?? ""),
        confirmNewPassword: String((payload as Record<string, unknown>).confirmNewPassword ?? ""),
      },
    });
  }

  @Post("logout")
  @HttpCode(200)
  public async logout(@Req() request: Request): Promise<{ success: true }> {
    const accessToken = this.extractAccessToken(request);
    await this.logoutUseCase.execute({ accessToken });
    return { success: true };
  }

  @Post("logout-all")
  @HttpCode(200)
  public async logoutAll(@Req() request: Request): Promise<{ success: true }> {
    const accessToken = this.extractAccessToken(request);
    await this.logoutAllUseCase.execute({ accessToken });
    return { success: true };
  }

  private extractAccessToken(request: Request): string {
    const authHeader = request.headers.authorization;

    if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
      throw new NestUnauthorizedException("Missing bearer token");
    }

    return authHeader.slice("Bearer ".length).trim();
  }
}
