import { loadEnv, parsePrismaEnv } from "@repo/config";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

loadEnv(fileURLToPath(new URL(".", import.meta.url)));

const prismaEnv = parsePrismaEnv(process.env);

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: prismaEnv.DATABASE_URL,
  },
});
