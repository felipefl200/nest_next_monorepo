import { z } from "zod";

export const userRoleSchema = z.enum(["ADMIN", "MANAGER"]);

export const accessTokenPayloadSchema = z.object({
  sub: z.string().min(1),
  sessionId: z.string().min(1),
  tokenVersion: z.number().int().min(0),
  role: userRoleSchema,
  iat: z.number().int().optional(),
  exp: z.number().int().optional(),
  iss: z.string().min(1),
  aud: z.string().min(1),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type AccessTokenPayload = z.infer<typeof accessTokenPayloadSchema>;

export function parseAccessTokenPayload(raw: unknown): AccessTokenPayload {
  return accessTokenPayloadSchema.parse(raw);
}
