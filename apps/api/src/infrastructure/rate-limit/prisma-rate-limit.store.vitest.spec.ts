import { describe, expect, it, vi } from "vitest";
import {
  PrismaRateLimitClient,
  PrismaRateLimitStore,
} from "./prisma-rate-limit.store";

type Entry = {
  key: string;
  count: number;
  expiresAt: Date;
  updatedAt: Date;
};

function createPrismaMock() {
  const storage = new Map<string, Entry>();
  const queryRaw: PrismaRateLimitClient["$queryRaw"] = async <T>(
    _query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T> => {
    const [key, expiresAt, now] = values as [string, Date, Date];
    const existing = storage.get(key);

    if (existing === undefined || existing.expiresAt.getTime() <= now.getTime()) {
      const created: Entry = {
        key,
        count: 1,
        expiresAt,
        updatedAt: now,
      };
      storage.set(key, created);
      return [{ count: created.count }] as T;
    }

    const updated: Entry = {
      ...existing,
      count: existing.count + 1,
      updatedAt: now,
    };
    storage.set(key, updated);
    return [{ count: updated.count }] as T;
  };

  const prisma: PrismaRateLimitClient = {
    rateLimitEntry: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        return storage.get(where.key) ?? null;
      }),
      delete: vi.fn(async ({ where }: { where: { key: string } }) => {
        const existing = storage.get(where.key);

        if (existing === undefined) {
          throw new Error("Entry not found");
        }

        storage.delete(where.key);
        return existing;
      }),
    },
    $queryRaw: vi.fn(queryRaw) as PrismaRateLimitClient["$queryRaw"],
  };

  return { prisma, storage };
}

describe("PrismaRateLimitStore", () => {
  it("creates and increments entries in the same window", async () => {
    const { prisma } = createPrismaMock();
    const store = new PrismaRateLimitStore(prisma);

    const first = await store.increment("ip:127.0.0.1", 60);
    const second = await store.increment("ip:127.0.0.1", 60);

    expect(first).toBe(1);
    expect(second).toBe(2);
  });

  it("resets count after expiration", async () => {
    const { prisma, storage } = createPrismaMock();
    const store = new PrismaRateLimitStore(prisma);
    const key = "ip:127.0.0.1";

    storage.set(key, {
      key,
      count: 5,
      expiresAt: new Date(Date.now() - 1_000),
      updatedAt: new Date(Date.now() - 1_000),
    });

    const count = await store.increment(key, 60);
    expect(count).toBe(1);
  });

  it("counts concurrent increments correctly", async () => {
    const { prisma } = createPrismaMock();
    const store = new PrismaRateLimitStore(prisma);
    const key = "ip:127.0.0.1";
    const attempts = 10;

    const results = await Promise.all(
      Array.from({ length: attempts }, () => store.increment(key, 60)),
    );

    expect(Math.max(...results)).toBe(attempts);
  });

  it("resets existing keys and ignores missing keys", async () => {
    const { prisma, storage } = createPrismaMock();
    const store = new PrismaRateLimitStore(prisma);
    const key = "ip:127.0.0.1";

    storage.set(key, {
      key,
      count: 3,
      expiresAt: new Date(Date.now() + 10_000),
      updatedAt: new Date(),
    });

    await expect(store.reset(key)).resolves.toBeUndefined();
    await expect(store.reset("missing-key")).resolves.toBeUndefined();
    expect(storage.has(key)).toBe(false);
  });
});
