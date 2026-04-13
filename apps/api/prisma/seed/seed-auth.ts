import { loadEnv, parseSeedAuthEnv } from "@repo/config";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

loadEnv(fileURLToPath(new URL("../..", import.meta.url)));
const env = parseSeedAuthEnv(process.env);

async function seedRoles(prisma: PrismaClient): Promise<void> {
  await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" },
  });

  await prisma.role.upsert({
    where: { name: "MANAGER" },
    update: {},
    create: { name: "MANAGER" },
  });
}

async function seedAdminUser(
  prisma: PrismaClient,
  password: string,
): Promise<void> {
  const adminEmail = "admin@ecommerce.local";
  const adminName = "Admin";
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      isActive: true,
      isEmailVerified: true,
      role: {
        connect: {
          name: "ADMIN",
        },
      },
    },
    create: {
      name: adminName,
      email: adminEmail,
      isActive: true,
      isEmailVerified: true,
      role: {
        connect: {
          name: "ADMIN",
        },
      },
    },
  });

  await prisma.userCredential.upsert({
    where: {
      userId: adminUser.id,
    },
    update: {
      passwordHash,
      passwordChangedAt: new Date(),
    },
    create: {
      userId: adminUser.id,
      passwordHash,
      passwordChangedAt: new Date(),
    },
  });
}

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await seedRoles(prisma);
    await seedAdminUser(prisma, env.ADMIN_SEED_PASSWORD);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
