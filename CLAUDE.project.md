# このプロジェクトのルール

## 技術

- TypeScript 6.0 系、Node 24、npm
- 表示ページ：Vite 8 + React 19（`index.html`、`src/web/`）
- テスト：Vitest 5（表示ページは jsdom と Testing Library、スクリプトは node）、Playwright 1.64（`e2e/`）
- 整形・Lint：Biome 2（`biome.jsonc`）
- DB・ログイン：Firebase（使う機能の Issue で入れる）
- 要約の AI：Gemini の Flash-Lite 系（取得の Issue で入れる）
- デプロイ：GitHub Pages、定期実行と CI は GitHub Actions

## よく使うコマンド

| すること | コマンド |
| --- | --- |
| 表示ページを立ち上げる | `npm run dev` |
| テスト（Vitest） | `npm test`（1ファイルだけなら `npm test -- <ファイル>`） |
| ブラウザの操作のテスト（Playwright） | `npm run test:e2e` |
| Lint と整形の確認 | `npm run lint`（直すなら `npm run lint:fix`） |
| 型チェック | `npm run typecheck` |
| build | `npm run build` |

## うまくいかなかったことから追加したルール
