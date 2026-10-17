# Vite

書いた時点のバージョン：8.3.4（`@vitejs/plugin-react` 6.1.2）

表示ページの開発サーバーと build の道具。`npm run dev` で立ち上げ、`npm run build` で `dist/` に静的なファイルを書き出す。

## このプロジェクトで使っているところ

- 設定は `vite.config.ts`。React のプラグインと、Vitest の設定（`test`）を同じファイルに書いている
- 入口は `index.html`。そこから `src/web/main.tsx` を読む
- 型チェックは Vite ではしないので、build の前に `tsc -b` を走らせている（`package.json` の `build`）

## 公式

- https://vite.dev/guide/
- 設定の一覧：https://vite.dev/config/
