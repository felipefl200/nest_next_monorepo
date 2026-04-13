export type SettingEntity = {
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
};

export interface ISettingRepository {
  list(): Promise<SettingEntity[]>;
  upsert(key: string, value: string): Promise<SettingEntity>;
}
