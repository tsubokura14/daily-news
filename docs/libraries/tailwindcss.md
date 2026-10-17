# Tailwind CSS

書いた時点のバージョン：`tailwindcss` 4.3.x、`@tailwindcss/vite` 4.3.x

クラス名（`p-4`、`text-ink` など）で見た目を書く CSS の道具。v4 は、トークンを CSS の `@theme` に書く。

## このプロジェクトで使っているところ

- Vite のプラグイン（`@tailwindcss/vite`）として、`vite.config.ts` で読む
- `src/web/styles/index.css` の先頭で `@import "tailwindcss"` する
- トークンは `src/web/styles/tokens.css` の `@theme` に書き、`bg-bg`、`text-ink`、`font-brand` のようなクラスになる
- Biome が `@theme` などを読めるよう、`biome.jsonc` で `css.parser.tailwindDirectives` を有効にしている

## 公式

- https://tailwindcss.com/docs/installation/using-vite
- `@theme` とトークン：https://tailwindcss.com/docs/theme
