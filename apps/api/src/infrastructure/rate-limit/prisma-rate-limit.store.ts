import { IRateLimitStore } from "../../domain/rate-limit/irate-limit-store";

type RateLimitEntryRecord = {
  key: string;
  count: number;
  expiresAt: Date;
  updatedAt: Date;
};

type RateLimitWhere = {
  key: string;
};

type IncrementInput = {
  increment: number;
};

type RateLimitUpdateData = {
  count?: number | IncrementInput;
  expiresAt?: Date;
  updatedAt?: Date;
};

type RateLimitCreateData = {
  key: string;
  count: number;
  expiresAt: Date;
};

type RateLimitDelegate = {
  findUnique(args: { where: RateLimitWhere }): Promise<RateLimitEntryRecord | null>;
  upsert(args: {
    where: RateLimitWhere;
    create: RateLimitCreateData;
    update: RateLimitUpdateData;
  }): Promise<RateLimitEntryRecord>;
  update(args: {
    where: RateLimitWhere;
    data: RateLimitUpdateData;
  }): Promise<RateLimitEntryRecord>;
  delete(args: { where: RateLimitWhere }): Promise<RateLimitEntryRecord>;
};

export type PrismaRateLimitClient = {
  rateLimitEntry: RateLimitDelegate;
};

export class PrismaRateLimitStore implements IRateLimitStore {
  private readonly prisma: PrismaRateLimitClient;

  public constructor(prisma: PrismaRateLimitClient) {
    this.prisma = prisma;
  }

  public async increment(key: string, windowSeconds: number): Promise<number> {
    if (windowSeconds <= 0) {
      throw new Error("windowSeconds must be greater than zero");
    }

    const now = new Date();
    const currentEntry = await this.prisma.rateLimitEntry.findUnique({
      where: { key },
    });

    if (currentEntry === null || currentEntry.expiresAt.getTime() <= now.getTime()) {
      const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
      const resetEntry = await this.prisma.rateLimitEntry.upsert({
        where: { key },
        create: {
          key,
          count: 1,
          expiresAt,
        },
        update: {
          count: 1,
          expiresAt,
          updatedAt: now,
        },
      });

      return resetEntry.count;
    }

    const updatedEntry = await this.prisma.rateLimitEntry.update({
      where: { key },
      data: {
        count: { increment: 1 },
        updatedAt: now,
      },
    });

    return updatedEntry.count;
  }

  public async reset(key: string): Promise<void> {
    const currentEntry = await this.prisma.rateLimitEntry.findUnique({
      where: { key },
    });

    if (currentEntry === null) {
      return;
    }

    await this.prisma.rateLimitEntry.delete({
      where: { key },
    });
  }
}
