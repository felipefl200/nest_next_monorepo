import { z } from "zod";

const emptyStringToUndefined = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value.length === 0 ? undefined : value));

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required"),
  email: z.string().trim().email("Valid email is required"),
  phone: z.string().trim().min(1, "Phone is required"),
  taxId: emptyStringToUndefined.optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(1).optional(),
  taxId: z.union([z.string().trim().min(1), z.null()]).optional(),
});

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQueryDto = z.infer<typeof listCustomersQuerySchema>;
