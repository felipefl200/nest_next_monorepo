import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import { userRoleSchema } from "../../domain/auth/auth.types";
import type {
  IAdminUserRepository,
  ListManagedUsersQuery,
  ManagedUserEntity,
  PaginatedManagedUsers,
  UpdateManagedUserInput,
} from "../../domain/admin-users/admin-user.types";
import type { UserRole } from "../../domain/auth/auth.types";

type PrismaManagedUserRecord = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: {
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

type PrismaManagedUserClient = {
  user: {
    create(args: {
      data: {
        name: string;
        email: string;
        role: {
          connect: {
            name: UserRole;
          };
        };
        credential: {
          create: {
            passwordHash: string;
          };
        };
      };
      include: {
        role: true;
      };
    }): Promise<PrismaManagedUserRecord>;
    findUnique(args: {
      where: { id?: string; email?: string };
      include: {
        role: true;
      };
    }): Promise<PrismaManagedUserRecord | null>;
    findMany(args: {
      where?: Record<string, unknown>;
      skip?: number;
      take?: number;
      orderBy?: { createdAt: "asc" | "desc" };
      include: {
        role: true;
      };
    }): Promise<PrismaManagedUserRecord[]>;
    count(args?: { where?: Record<string, unknown> }): Promise<number>;
    update(args: {
      where: { id: string };
      data: Record<string, unknown>;
      include?: {
        role: true;
      };
    }): Promise<unknown>;
    updateMany(args: {
      where: { id: string };
      data: { isActive: boolean };
    }): Promise<unknown>;
  };
  session: {
    updateMany(args: {
      where: {
        userId: string;
        revokedAt: null;
      };
      data: {
        revokedAt: Date;
        lastUsedAt: Date;
      };
    }): Promise<unknown>;
  };
};

function mapManagedUser(record: PrismaManagedUserRecord): ManagedUserEntity {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    isActive: record.isActive,
    role: userRoleSchema.parse(record.role.name),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

@Injectable()
export class PrismaAdminUserRepository implements IAdminUserRepository {
  private readonly prisma: PrismaService & PrismaManagedUserClient;

  public constructor(prismaService: PrismaService) {
    this.prisma = prismaService as PrismaService & PrismaManagedUserClient;
  }

  public async createUser(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<ManagedUserEntity> {
    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        role: {
          connect: {
            name: input.role,
          },
        },
        credential: {
          create: {
            passwordHash: input.passwordHash,
          },
        },
      },
      include: {
        role: true,
      },
    });

    return mapManagedUser(user);
  }

  public async findUserById(id: string): Promise<ManagedUserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    if (user === null) {
      return null;
    }

    return mapManagedUser(user);
  }

  public async findUserByEmail(email: string): Promise<ManagedUserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (user === null) {
      return null;
    }

    return mapManagedUser(user);
  }

  public async listUsers(query: ListManagedUsersQuery): Promise<PaginatedManagedUsers> {
    const skip = (query.page - 1) * query.perPage;

    const where: Record<string, unknown> = {};
    if (query.search !== undefined) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: query.perPage,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          role: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / query.perPage);

    return {
      data: users.map(mapManagedUser),
      total,
      page: query.page,
      perPage: query.perPage,
      totalPages,
    };
  }

  public async updateUser(id: string, input: UpdateManagedUserInput): Promise<ManagedUserEntity> {
    const data: {
      name?: string;
      email?: string;
      role?: {
        connect: {
          name: UserRole;
        };
      };
    } = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }
    if (input.email !== undefined) {
      data.email = input.email;
    }
    if (input.role !== undefined) {
      data.role = {
        connect: {
          name: input.role,
        },
      };
    }

    const user = (await this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
      },
    })) as PrismaManagedUserRecord;

    return mapManagedUser(user);
  }

  public async deactivateUser(id: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id },
      data: {
        isActive: false,
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
