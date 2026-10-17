import { defineConfig, devices } from "@playwright/test";

// 撮るときに立ち上げるサーバーのポート。複数のフォルダで並べて動かすときは、環境変数 PORT で変える
const port = Number(process.env.PORT ?? 5173);

export default defineConfig({
  testDir: "e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  // 画面の画像は、OS 名を入れずに docs/specs/screens/ に置く（撮るのは Docker の中だけ）
  snapshotPathTemplate: "docs/specs/screens/{arg}{ext}",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    // 主にスマホで読むため、スマホの幅で動かす
    {
      name: "mobile",
      testIgnore: "screens/**",
      use: { ...devices["Pixel 7"] },
    },
    // 画面を撮って基準の画像と比べる。手元では npm run test:screens（Docker の中）で動かす
    {
      name: "screens",
      testMatch: "screens/**/*.spec.ts",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
