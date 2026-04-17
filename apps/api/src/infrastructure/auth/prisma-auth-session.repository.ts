import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import {
  AuthSession,
  AuthSessionWithUser,
  AuthUser,
  IAuthSessionRepository,
} from "../../domain/auth/auth-session.repository";
import { UserRole, userRoleSchema } from "../../domain/auth/auth.types";

type PrismaRoleRecord = {
  name: string;
};

type PrismaUserCredentialRecord = {
  passwordHash: string;
  passwordChangedAt: Date | null;
};

type PrismaUserRecord = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  tokenVersion: number;
  role: PrismaRoleRecord;
  credential: PrismaUserCredentialRecord | null;
};

type PrismaSessionRecord = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
  user: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    tokenVersion: number;
    role: PrismaRoleRecord;
  };
};

type PrismaCreatedSessionRecord = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date | null;
};

type PrismaUserDelegate = {
  findUnique(args: {
    where: { email: string } | { id: string };
    include: {
      role: true;
      credential: true;
    };
  }): Promise<PrismaUserRecord | null>;
  update(args: {
    where: { id: string };
    data: Record<string, unknown>;
    include?: {
      role: true;
      credential: true;
    };
  }): Promise<PrismaUserRecord>;
};

type PrismaSessionDelegate = {
  findUnique(args: {
    where: { id: string };
    include: {
      user: {
        include: {
          role: true;
        };
      };
    };
  }): Promise<PrismaSessionRecord | null>;
  create(args: {
    data: {
      id: string;
      userId: string;
      refreshTokenHash: string;
      userAgent: string | null;
      ipAddress: string | null;
      expiresAt: Date;
    };
  }): Promise<PrismaCreatedSessionRecord>;
  updateMany(args: {
    where: { id?: string; userId?: string; revokedAt: null; NOT?: { id: string } };
    data: {
      revokedAt: Date;
      lastUsedAt: Date;
    };
  }): Promise<unknown>;
};

export type PrismaAuthSessionClient = {
  user: PrismaUserDelegate;
  session: PrismaSessionDelegate;
};

function parseRole(roleName: string): UserRole {
  return userRoleSchema.parse(roleName);
}

@Injectable()
export class PrismaAuthSessionRepository implements IAuthSessionRepository {
  private readonly prisma: PrismaService & PrismaAuthSessionClient;

  public constructor(prismaService: PrismaService) {
    this.prisma = prismaService as PrismaService & PrismaAuthSessionClient;
  }

  public async findUserByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        credential: true,
      },
    });

    if (user === null) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      tokenVersion: user.tokenVersion,
      role: parseRole(user.role.name),
      passwordHash: user.credential?.passwordHash ?? null,
    };
  }

  public async findUserById(userId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        credential: true,
      },
    });

    if (user === null) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      tokenVersion: user.tokenVersion,
      role: parseRole(user.role.name),
      passwordHash: user.credential?.passwordHash ?? null,
    };
  }

  public async findCurrentUserById(
    userId: string,
  ): Promise<Omit<AuthUser, "passwordHash"> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        credential: true,
      },
    });

    if (user === null) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      tokenVersion: user.tokenVersion,
      role: parseRole(user.role.name),
    };
  }

  public async findSessionById(sessionId: string): Promise<AuthSessionWithUser | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
    });

    if (session === null) {
      return null;
    }

    return {
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      lastUsedAt: session.lastUsedAt,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        isActive: session.user.isActive,
        tokenVersion: session.user.tokenVersion,
        role: parseRole(session.user.role.name),
      },
    };
  }

  public async createSession(input: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }): Promise<AuthSession> {
    const createdSession = await this.prisma.session.create({
      data: {
        id: input.id,
        userId: input.userId,
        refreshTokenHash: input.refreshTokenHash,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt: input.expiresAt,
      },
    });

    return {
      id: createdSession.id,
      userId: createdSession.userId,
      refreshTokenHash: createdSession.refreshTokenHash,
      userAgent: createdSession.userAgent,
      ipAddress: createdSession.ipAddress,
      expiresAt: createdSession.expiresAt,
      revokedAt: createdSession.revokedAt,
      lastUsedAt: createdSession.lastUsedAt,
    };
  }

  public async revokeSessionById(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });
  }

  public async revokeAllSessionsByUserId(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });
  }

  public async revokeOtherSessionsByUserId(input: {
    userId: string;
    currentSessionId: string;
  }): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        userId: input.userId,
        revokedAt: null,
        NOT: {
          id: input.currentSessionId,
        },
      },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });
  }

  public async updateCurrentUserProfile(input: {
    userId: string;
    name: string;
    email: string;
  }): Promise<Omit<AuthUser, "passwordHash">> {
    const user = await this.prisma.user.update({
      where: { id: input.userId },
      data: {
        name: input.name,
        email: input.email,
      },
      include: {
        role: true,
        credential: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      tokenVersion: user.tokenVersion,
      role: parseRole(user.role.name),
    };
  }

  public async updateCurrentUserPassword(input: {
    userId: string;
    passwordHash: string;
    passwordChangedAt: Date;
  }): Promise<void> {
    await this.prisma.user.update({
      where: { id: input.userId },
      data: {
        credential: {
          update: {
            passwordHash: input.passwordHash,
            passwordChangedAt: input.passwordChangedAt,
          },
        },
      },
      include: {
        role: true,
        credential: true,
      },
    });
  }

  public async incrementUserTokenVersion(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        tokenVersion: {
          increment: 1,
        },
      },
    });
  }
}
