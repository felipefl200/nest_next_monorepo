import { z } from "zod";
import { userRoleSchema } from "../auth/auth.types";

export const createManagedUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  password: z.string().min(8, "Password must have at least 8 chars"),
  role: userRoleSchema,
});

export const updateManagedUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  role: userRoleSchema.optional(),
});

export const listManagedUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export type CreateManagedUserDto = z.infer<typeof createManagedUserSchema>;
export type UpdateManagedUserDto = z.infer<typeof updateManagedUserSchema>;
export type ListManagedUsersQueryDto = z.infer<typeof listManagedUsersQuerySchema>;
