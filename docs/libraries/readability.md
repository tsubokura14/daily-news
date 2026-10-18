# @mozilla/readability と jsdom

書いた時点のバージョン：@mozilla/readability 0.6.0、jsdom 29.1.1（型は `@types/jsdom`）

元記事の HTML から、広告やメニューを除いた本文の文字だけを取り出す。Readability は Firefox のリーダー表示と同じ仕組みで、動かすには DOM が要るので、Node では jsdom で HTML を読んで渡す。

## このプロジェクトで使っているところ

- `src/batch/body.ts` の `extractBody`：`new JSDOM(html)` で読み、`new Readability(document).parse()?.textContent` を本文とする。取れなければ `null`
- `VirtualConsole` を渡しているのは、元記事の CSS の解析の警告を出さないため
- `htmlToText`：Ask HN の投稿の文章（HTML の断片）を、`<p>` と `<br>` を改行にして文字にする
- jsdom は、表示ページのテスト（Vitest の jsdom 環境）でも使うが、取得のスクリプトの実行時にも要るので `dependencies` に置く

## 公式

- https://github.com/mozilla/readability
- https://github.com/jsdom/jsdom
