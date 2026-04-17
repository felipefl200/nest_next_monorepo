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

export const updateOwnProfileInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  currentPassword: z.string().min(1, "Current password is required"),
});

export const changeOwnPasswordInputSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must have at least 8 chars"),
    confirmNewPassword: z.string().min(8, "Password must have at least 8 chars"),
  })
  .refine((value) => value.newPassword === value.confirmNewPassword, {
    message: "Password confirmation must match",
    path: ["confirmNewPassword"],
  });

export type LoginInput = z.infer<typeof loginInputSchema>;
export type RefreshInput = z.infer<typeof refreshInputSchema>;
export type LogoutInput = z.infer<typeof logoutInputSchema>;
export type LogoutAllInput = z.infer<typeof logoutAllInputSchema>;
export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileInputSchema>;
export type ChangeOwnPasswordInput = z.infer<typeof changeOwnPasswordInputSchema>;
