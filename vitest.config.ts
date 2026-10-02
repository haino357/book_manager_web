import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/** lib/ の純粋関数のテスト。tsconfig と同じく `@/` をリポジトリのルートにする */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
  },
});
