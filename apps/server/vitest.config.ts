import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
});
