# Vitest

書いた時点のバージョン：5.0.5（jsdom 29）

テストを動かす道具。Vite の設定をそのまま使う。`npm test` で一度だけ動かす。

## このプロジェクトで使っているところ

- 設定は `vite.config.ts` の `test`。2つのプロジェクトに分けている
  - `web`：`src/web/**/*.test.{ts,tsx}`。ブラウザの代わりに jsdom で動かす。始めに `src/web/test-setup.ts` を読む
  - `node`：`src/batch/**/*.test.ts` と `src/shared/**/*.test.ts`。Node で動かす
- テストのファイルは、試すファイルの隣に置く
- テストが0件でも失敗にしない（`passWithNoTests`）

## 公式

- https://vitest.dev/guide/
- プロジェクトの分け方：https://vitest.dev/guide/projects
