import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { ListSettingsUseCase } from "../../application/settings/list-settings.use-case";
import { UpsertSettingUseCase } from "../../application/settings/upsert-setting.use-case";
import { upsertSettingSchema } from "../../domain/settings/setting.schemas";
import { Roles } from "../decorators/roles.decorator";
import { RoleGuard } from "../guards/role.guard";

@Controller("settings")
@UseGuards(RoleGuard)
@Roles("ADMIN")
export class SettingsController {
  public constructor(
    private readonly listSettingsUseCase: ListSettingsUseCase,
    private readonly upsertSettingUseCase: UpsertSettingUseCase,
  ) {}

  @Get()
  public async list() {
    return this.listSettingsUseCase.execute();
  }

  @Put(":key")
  public async upsert(@Param("key") key: string, @Body() body: unknown) {
    const validated = upsertSettingSchema.parse({
      key,
      value: (body as { value?: unknown }).value,
    });

    return this.upsertSettingUseCase.execute(validated);
  }
}
