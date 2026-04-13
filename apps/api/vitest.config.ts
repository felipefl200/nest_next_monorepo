import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
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
