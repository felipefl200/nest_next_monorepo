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

type RateLimitDelegate = {
  findUnique(args: { where: RateLimitWhere }): Promise<RateLimitEntryRecord | null>;
  delete(args: { where: RateLimitWhere }): Promise<RateLimitEntryRecord>;
};

export type PrismaRateLimitClient = {
  rateLimitEntry: RateLimitDelegate;
  $queryRaw<T>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
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
    const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
    const [entry] = await this.prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "RateLimitEntry" ("key", "count", "expiresAt", "updatedAt")
      VALUES (${key}, 1, ${expiresAt}, ${now})
      ON CONFLICT ("key") DO UPDATE
      SET
        "count" = CASE
          WHEN "RateLimitEntry"."expiresAt" > ${now}
          THEN "RateLimitEntry"."count" + 1
          ELSE 1
        END,
        "expiresAt" = CASE
          WHEN "RateLimitEntry"."expiresAt" > ${now}
          THEN "RateLimitEntry"."expiresAt"
          ELSE ${expiresAt}
        END,
        "updatedAt" = ${now}
      RETURNING "count"
    `;

    if (entry === undefined) {
      throw new Error("Atomic rate limit increment did not return a count");
    }

    return entry.count;
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
