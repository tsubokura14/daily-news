# Playwright

書いた時点のバージョン：1.64.1（`@playwright/test`。版を固定している）

本物のブラウザを動かして、画面の操作を試し、画面を撮って基準の画像と比べる道具。

## このプロジェクトで使っているところ

- 設定は `playwright.config.ts`。テストは `e2e/` に置く
- テストの前に開発サーバー（`npm run dev`）を自動で立ち上げる（`webServer`）。ポートは環境変数 `PORT`（既定 5173）
- スマホの幅（Pixel 7）の Chromium で動かす
- ブラウザは `npx playwright install chromium` で入れる
- プロジェクトが2つある：`mobile`（操作のテスト。`npm run test:e2e`）と `screens`（`e2e/screens/` の画像を比べるテスト。`npm run test:screens`）
- 基準の画像は `snapshotPathTemplate` で `docs/specs/screens/<名前>.png` に置く（OS 名を入れない）。撮るのは、同じ版の公式の Docker イメージの中だけ（`tools/playwright-docker.mjs`）
- 日時は `page.clock.install` で固定する
- 比べるだけのときは `--update-snapshots=none`、撮り直すときは `--update-snapshots=all`。付けないと、基準がないときに黙って書いてしまう

## 公式

- https://playwright.dev/docs/intro
- 設定：https://playwright.dev/docs/test-configuration
