import { existsSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
export { apiEnvSchema, parseApiEnv } from "./env.js";
export { prismaEnvSchema, parsePrismaEnv } from "./env.js";
export { seedAuthEnvSchema, parseSeedAuthEnv } from "./env.js";
export { seedDomainEnvSchema, parseSeedDomainEnv } from "./env.js";
export type { ApiEnv, PrismaEnv, SeedAuthEnv, SeedDomainEnv } from "./env.js";

function loadEnvFileIfPresent(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(filePath);
    return;
  }

  throw new Error(
    `Current Node.js runtime does not support process.loadEnvFile for ${filePath}.`,
  );
}

export function loadEnv(cwd = process.cwd()): void {
  const rootDir = resolve(cwd, "../..");
  const candidatePaths = [
    resolve(rootDir, ".env"),
    resolve(rootDir, ".env.local"),
    resolve(cwd, ".env"),
    resolve(cwd, ".env.local"),
  ];

  for (const filePath of candidatePaths) {
    loadEnvFileIfPresent(filePath);
  }
}
