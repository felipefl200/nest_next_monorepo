import { describe, expect, it, vi } from "vitest";
import { UpsertSettingUseCase } from "./upsert-setting.use-case";
import type { ISettingRepository, SettingEntity } from "../../domain/settings/setting.types";

function createMockRepository(): ISettingRepository {
  return {
    list: vi.fn(async () => []),
    upsert: vi.fn(async (key: string, value: string): Promise<SettingEntity> => ({
      key,
      value,
      createdAt: "2026-04-06T10:00:00.000Z",
      updatedAt: "2026-04-06T10:00:00.000Z",
    })),
  };
}

describe("UpsertSettingUseCase", () => {
  it("upserts setting by key", async () => {
    const repository = createMockRepository();
    const useCase = new UpsertSettingUseCase(repository);

    const result = await useCase.execute({
      key: "system.companyName",
      value: "Acme Inc",
    });

    expect(result.key).toBe("system.companyName");
    expect(result.value).toBe("Acme Inc");
    expect(repository.upsert).toHaveBeenCalledWith("system.companyName", "Acme Inc");
  });
});
