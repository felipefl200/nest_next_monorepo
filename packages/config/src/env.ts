import { z } from "zod";

const nodeEnvSchema = z.enum(["development", "test", "production"]).default("development");

function normalizePem(value: string): string {
  return value.replaceAll("\\n", "\n");
}

const pemSchema = z
  .string()
  .min(1)
  .transform(normalizePem)
  .refine(
    (value) =>
      value.includes("-----BEGIN") &&
      value.includes("-----END") &&
      value.includes("KEY-----"),
    "Expected a valid PEM encoded key",
  );

export const apiEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_PRIVATE_KEY: pemSchema,
  JWT_PUBLIC_KEY: pemSchema,
  JWT_ISSUER: z.string().min(1, "JWT_ISSUER is required"),
  JWT_AUDIENCE: z.string().min(1, "JWT_AUDIENCE is required"),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().min(1, "JWT_ACCESS_TOKEN_EXPIRES_IN is required"),
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().min(1, "JWT_REFRESH_TOKEN_EXPIRES_IN is required"),
  PORT: z.coerce.number().int().positive().default(3333),
  API_URL: z.url("API_URL must be a valid URL"),
  APP_CORS_ORIGIN: z.url("APP_CORS_ORIGIN must be a valid URL"),
  ADMIN_SEED_PASSWORD: z.string().min(8, "ADMIN_SEED_PASSWORD must have at least 8 characters"),
});

export const prismaEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});

export const seedAuthEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ADMIN_SEED_PASSWORD: z.string().min(8, "ADMIN_SEED_PASSWORD must have at least 8 characters"),
});

export const seedDomainEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DOMAIN_SEED_RANDOM_SEED: z.coerce.number().int().default(42),
  DOMAIN_SEED_ORDER_COUNT: z.coerce.number().int().positive().default(250),
});

export type ApiEnv = z.output<typeof apiEnvSchema>;
export type PrismaEnv = z.output<typeof prismaEnvSchema>;
export type SeedAuthEnv = z.output<typeof seedAuthEnvSchema>;
export type SeedDomainEnv = z.output<typeof seedDomainEnvSchema>;

export function parseApiEnv(input: Record<string, unknown>): ApiEnv {
  return apiEnvSchema.parse(input);
}

export function parsePrismaEnv(input: Record<string, unknown>): PrismaEnv {
  return prismaEnvSchema.parse(input);
}

export function parseSeedAuthEnv(input: Record<string, unknown>): SeedAuthEnv {
  return seedAuthEnvSchema.parse(input);
}

export function parseSeedDomainEnv(input: Record<string, unknown>): SeedDomainEnv {
  return seedDomainEnvSchema.parse(input);
}
