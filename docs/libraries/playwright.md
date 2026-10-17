# Playwright

書いた時点のバージョン：1.64.1（`@playwright/test`。版を固定している）

本物のブラウザを動かして、画面の操作を試す道具。あとのタスクで、画面を撮って比べるテストにも使う。

## このプロジェクトで使っているところ

- 設定は `playwright.config.ts`。テストは `e2e/` に置く
- テストの前に開発サーバー（`npm run dev`）を自動で立ち上げる（`webServer`）
- スマホの幅（Pixel 7）の Chromium で動かす
- ブラウザは `npx playwright install chromium` で入れる

## 公式

- https://playwright.dev/docs/intro
- 設定：https://playwright.dev/docs/test-configuration
