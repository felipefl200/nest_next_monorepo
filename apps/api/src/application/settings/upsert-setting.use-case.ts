import { Inject, Injectable } from "@nestjs/common";
import { SETTING_REPOSITORY } from "../../domain/tokens";
import type { ISettingRepository, SettingEntity } from "../../domain/settings/setting.types";

@Injectable()
export class UpsertSettingUseCase {
  public constructor(
    @Inject(SETTING_REPOSITORY)
    private readonly settingRepository: ISettingRepository,
  ) {}

  public async execute(input: { key: string; value: string }): Promise<SettingEntity> {
    return this.settingRepository.upsert(input.key, input.value);
  }
}
