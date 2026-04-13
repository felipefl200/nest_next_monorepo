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

  const prisma: PrismaRateLimitClient = {
    rateLimitEntry: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        return storage.get(where.key) ?? null;
      }),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { key: string };
          create: { key: string; count: number; expiresAt: Date };
          update: {
            count?: number | { increment: number };
            expiresAt?: Date;
            updatedAt?: Date;
          };
        }) => {
          const existing = storage.get(where.key);
          const now = update.updatedAt ?? new Date();

          if (existing === undefined) {
            const created: Entry = {
              key: create.key,
              count: create.count,
              expiresAt: create.expiresAt,
              updatedAt: now,
            };
            storage.set(where.key, created);
            return created;
          }

          const updated: Entry = {
            ...existing,
            count:
              typeof update.count === "number" ? update.count : existing.count,
            expiresAt: update.expiresAt ?? existing.expiresAt,
            updatedAt: now,
          };
          storage.set(where.key, updated);
          return updated;
        },
      ),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { key: string };
          data: { count?: number | { increment: number }; updatedAt?: Date };
        }) => {
          const existing = storage.get(where.key);

          if (existing === undefined) {
            throw new Error("Entry not found");
          }

          const increment =
            typeof data.count === "object" && data.count !== null
              ? data.count.increment
              : 0;

          const updated: Entry = {
            ...existing,
            count: existing.count + increment,
            updatedAt: data.updatedAt ?? new Date(),
          };
          storage.set(where.key, updated);
          return updated;
        },
      ),
      delete: vi.fn(async ({ where }: { where: { key: string } }) => {
        const existing = storage.get(where.key);

        if (existing === undefined) {
          throw new Error("Entry not found");
        }

        storage.delete(where.key);
        return existing;
      }),
    },
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
