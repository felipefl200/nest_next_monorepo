import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { CreateManagedUserUseCase } from "../../application/admin-users/create-managed-user.use-case";
import { DeactivateManagedUserUseCase } from "../../application/admin-users/deactivate-managed-user.use-case";
import { ListManagedUsersUseCase } from "../../application/admin-users/list-managed-users.use-case";
import { UpdateManagedUserUseCase } from "../../application/admin-users/update-managed-user.use-case";
import {
  createManagedUserSchema,
  listManagedUsersQuerySchema,
  updateManagedUserSchema,
} from "../../domain/admin-users/admin-user.schemas";
import type { AccessTokenPayload } from "../../domain/auth/auth.types";
import { Roles } from "../decorators/roles.decorator";
import { RoleGuard } from "../guards/role.guard";

type AuthenticatedRequest = Request & {
  user: AccessTokenPayload;
};

@Controller("users")
@UseGuards(RoleGuard)
@Roles("ADMIN")
export class AdminUsersController {
  public constructor(
    private readonly createManagedUserUseCase: CreateManagedUserUseCase,
    private readonly listManagedUsersUseCase: ListManagedUsersUseCase,
    private readonly updateManagedUserUseCase: UpdateManagedUserUseCase,
    private readonly deactivateManagedUserUseCase: DeactivateManagedUserUseCase,
  ) {}

  @Post()
  public async create(@Body() body: unknown) {
    const validated = createManagedUserSchema.parse(body);
    return this.createManagedUserUseCase.execute(validated);
  }

  @Get()
  public async list(@Query() query: unknown) {
    const validated = listManagedUsersQuerySchema.parse(query);
    return this.listManagedUsersUseCase.execute(validated);
  }

  @Patch(":id")
  public async update(@Param("id") id: string, @Body() body: unknown, @Req() request: AuthenticatedRequest) {
    const validated = updateManagedUserSchema.parse(body);
    return this.updateManagedUserUseCase.execute({
      actorUserId: request.user.sub,
      targetUserId: id,
      updates: validated,
    });
  }

  @Delete(":id")
  public async deactivate(@Param("id") id: string, @Req() request: AuthenticatedRequest) {
    await this.deactivateManagedUserUseCase.execute({
      actorUserId: request.user.sub,
      targetUserId: id,
    });

    return {
      statusCode: HttpStatus.OK,
      message: "User deactivated successfully",
    };
  }
}
