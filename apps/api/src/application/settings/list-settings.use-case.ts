import { Inject, Injectable } from "@nestjs/common";
import { SETTING_REPOSITORY } from "../../domain/tokens";
import type { ISettingRepository, SettingEntity } from "../../domain/settings/setting.types";

@Injectable()
export class ListSettingsUseCase {
  public constructor(
    @Inject(SETTING_REPOSITORY)
    private readonly settingRepository: ISettingRepository,
  ) {}

  public async execute(): Promise<SettingEntity[]> {
    return this.settingRepository.list();
  }
}
