import { z } from "zod";

export const upsertSettingSchema = z.object({
  key: z.string().trim().min(1, "Setting key is required"),
  value: z.string().trim().min(1, "Setting value is required"),
});

export type UpsertSettingDto = z.infer<typeof upsertSettingSchema>;
