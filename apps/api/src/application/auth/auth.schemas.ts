import { z } from "zod";

export const loginInputSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  ipAddress: z.string().trim().min(1).optional(),
  userAgent: z.string().trim().min(1).optional(),
});

export const refreshInputSchema = z.object({
  refreshToken: z.string().min(1),
  ipAddress: z.string().trim().min(1).optional(),
  userAgent: z.string().trim().min(1).optional(),
});

export const logoutInputSchema = z.object({
  accessToken: z.string().min(1),
});

export const logoutAllInputSchema = z.object({
  accessToken: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
export type RefreshInput = z.infer<typeof refreshInputSchema>;
export type LogoutInput = z.infer<typeof logoutInputSchema>;
export type LogoutAllInput = z.infer<typeof logoutAllInputSchema>;
