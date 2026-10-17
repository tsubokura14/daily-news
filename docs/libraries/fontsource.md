# Fontsource

書いた時点のバージョン：`@fontsource-variable/noto-sans-jp` 5.3.1、`@fontsource-variable/noto-serif-jp` 5.3.1、`@fontsource-variable/fraunces` 5.3.0

Web フォントを npm のパッケージとして同梱する仕組み。Google Fonts に取りに行かず、build に含める。

## このプロジェクトで使っているところ

- `src/web/styles/index.css` で、可変フォントの CSS を読む。太さ（wght）の軸だけの `wght.css`（Noto Sans JP、Noto Serif JP）と、角を丸くする軸（SOFT）を含む `soft.css`（Fraunces）
- CSS の `font-family` の名前は、`Noto Sans JP Variable` のように末尾に `Variable` が付く。`src/web/styles/tokens.css` の書体のトークンに、この名前を書いている
- 日本語の書体は文字の範囲ごとに分かれたファイルになっていて、ページで使う文字を含むファイルだけが読まれる

## 公式

- https://fontsource.org/docs/getting-started/install
- Fraunces の軸：https://fontsource.org/fonts/fraunces
