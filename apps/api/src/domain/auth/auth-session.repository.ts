import { UserRole } from "./auth.types";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  tokenVersion: number;
  role: UserRole;
  passwordHash: string | null;
};

export type AuthSession = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
};

export type AuthSessionWithUser = AuthSession & {
  user: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    tokenVersion: number;
    role: UserRole;
  };
};

export interface IAuthSessionRepository {
  findUserByEmail(email: string): Promise<AuthUser | null>;
  findCurrentUserById(userId: string): Promise<Omit<AuthUser, "passwordHash"> | null>;
  findSessionById(sessionId: string): Promise<AuthSessionWithUser | null>;
  createSession(input: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }): Promise<AuthSession>;
  revokeSessionById(sessionId: string): Promise<void>;
  revokeAllSessionsByUserId(userId: string): Promise<void>;
  incrementUserTokenVersion(userId: string): Promise<void>;
}
