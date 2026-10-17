<!--
このプロジェクトだけのAIへのルール。Claude Code は CLAUDE.md から @ で読み込み、GitHub Copilot は AGENTS.md の指示で読む。
AGENTS.md と CLAUDE.md はテンプレートのものなので、このプロジェクトで決まりを足すときはこのファイルに書く（docs/template-files.md）
-->

# このプロジェクトのルール

## 技術

- TypeScript 6.0 系、npm
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
| ブラウザの操作のテスト（Playwright。画面の画像は除く） | `npm run test:e2e` |
| 画面を撮って、`docs/specs/screens/` の基準と比べる（Docker が要る） | `npm run test:screens` |
| 画面の基準を撮り直す（Docker が要る） | `npm run test:screens:update` |
| 撮るときのポートを変える | 環境変数 `PORT`（既定は 5173）。PowerShell：`$env:PORT=5299; npm run test:screens`、bash：`PORT=5299 npm run test:screens` |
| Lint と整形の確認 | `npm run lint`（直すなら `npm run lint:fix`） |
| 型チェック | `npm run typecheck` |
| build | `npm run build` |

## うまくいかなかったことから追加したルール

<!-- 同じ注意を2回しないために、日付つきで書き足す。使わなくなったら消してよい。例：
- 2026-09-17: 日付の比較は、時刻を切り捨ててから行う
-->
