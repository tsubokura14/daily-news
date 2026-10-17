# Biome

書いた時点のバージョン：2.5.15（版を固定している）

整形と Lint を1つでする道具。`npm run lint` で確かめ、`npm run lint:fix` で直す。

## このプロジェクトで使っているところ

- 設定は `biome.jsonc`。推奨のルール（`recommended`）、2文字の空白で字下げ、1行100文字、二重引用符
- `.gitignore` に書いたもの（`node_modules`、`dist` など）と、テンプレートのファイル（`.claude`、`scripts`、`docs`、`.github/template-tests`）は見ない
- import の並べ替えもする（`organizeImports`）
- 改行は LF。Windows でも LF で取り出すよう `.gitattributes` に書いている

## 公式

- https://biomejs.dev/guides/getting-started/
- 設定：https://biomejs.dev/reference/configuration/
- ルールの一覧：https://biomejs.dev/linter/javascript/rules/
