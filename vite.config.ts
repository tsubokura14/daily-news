import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // GitHub Pages の https://tsubokura14.github.io/daily-news/ に出すため、リポジトリ名の下に置く
  base: "/daily-news/",
  plugins: [react(), tailwindcss()],
  test: {
    // 機能を作る前でも、テストのコマンドが失敗で終わらないようにする
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: "web",
          environment: "jsdom",
          include: ["src/web/**/*.test.{ts,tsx}"],
          setupFiles: ["src/web/test-setup.ts"],
        },
      },
      {
        test: {
          name: "node",
          environment: "node",
          include: ["src/batch/**/*.test.ts", "src/shared/**/*.test.ts", "tools/**/*.test.mjs"],
        },
      },
    ],
  },
});
