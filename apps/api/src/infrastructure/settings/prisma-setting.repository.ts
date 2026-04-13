import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import type { ISettingRepository, SettingEntity } from "../../domain/settings/setting.types";

type PrismaSettingRecord = {
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaSettingClient = {
  setting: {
    findMany(args?: {
      orderBy?: { key: "asc" | "desc" };
    }): Promise<PrismaSettingRecord[]>;
    upsert(args: {
      where: { key: string };
      update: { value: string };
      create: { key: string; value: string };
    }): Promise<PrismaSettingRecord>;
  };
};

function mapSetting(record: PrismaSettingRecord): SettingEntity {
  return {
    key: record.key,
    value: record.value,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

@Injectable()
export class PrismaSettingRepository implements ISettingRepository {
  private readonly prisma: PrismaService & PrismaSettingClient;

  public constructor(prismaService: PrismaService) {
    this.prisma = prismaService as PrismaService & PrismaSettingClient;
  }

  public async list(): Promise<SettingEntity[]> {
    const settings = await this.prisma.setting.findMany({
      orderBy: { key: "asc" },
    });

    return settings.map(mapSetting);
  }

  public async upsert(key: string, value: string): Promise<SettingEntity> {
    const setting = await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return mapSetting(setting);
  }
}
