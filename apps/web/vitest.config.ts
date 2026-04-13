import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
    conditions: ["node", "import", "default"],
  },
  test: {
    include: ["src/**/*.vitest.spec.ts"],
    environment: "node",
    globals: false,
    restoreMocks: true,
    clearMocks: true,
  },
});
