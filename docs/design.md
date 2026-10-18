<!--
今の設計。アプリが今どう作られているかのうち、複数の場所に関わるものを、理由と前提つきで現在形で書く。
書き方は code-notes スキル（.claude/skills/code-notes/SKILL.md）。
-->

# 今の設計

## 全体の構成

表示ページ（Vite + React）が、記事の JSON を静的なファイルとして読む。取得・要約のスクリプトは、表示ページとは別に Node で動く。

| 場所 | 置くもの |
| --- | --- |
| `index.html`、`vite.config.ts` | 表示ページの入口と設定（Vite の決まりの場所） |
| `src/web/` | 表示ページ（React）。`src/web/styles/` にトークンと書体の読み込み |
| `src/batch/` | 取得・要約のスクリプト |
| `src/shared/` | 表示ページとスクリプトの両方が使うもの（記事の JSON の型など） |
| `data/` | 記事の JSON |
| `e2e/` | Playwright のテスト。`e2e/screens/` に、画面を撮って基準と比べるテスト |
| `docs/specs/screens/` | 画面の画像（比べるテストの基準） |
| `tools/` | 開発のための Node のスクリプト（Docker で撮る、編集後に整形する、など） |
| `scripts/` | テンプレートのスクリプト。`tools/` と分ける |

`src/batch/`、`data/` は、取得の機能を作るときにできる。

- Vitest のテストは、試すファイルの隣に `*.test.ts` / `*.test.tsx` で置く（`tools/` は `*.test.mjs`）。`src/web/` は jsdom、それ以外は node で動かす（`vite.config.ts` の `projects`）
- 画面の画像は、Playwright 公式の Docker イメージの中だけで撮る
  - 理由：OS が違うと文字の描き方が変わり、手元（Windows）と CI で画像が一致しないため
  - 前提（崩れたら見直す）：Playwright の版を上げたら、Docker イメージの版も同じにする（`ci.yml` と `tools/playwright-docker.mjs`）
- 画面の状態（0件、エラー、読み込み中など）は、ブラウザが取りに行く記事の JSON の返事を `page.route` で差し替えて作る
  - 前提：画面が記事をブラウザ側で取ってくる作りであること。サーバー側で画面を組み立てる作りに変えたら、テスト用のデータで作る方法に変える
- 表示ページは `https://tsubokura14.github.io/daily-news/` に出すので、`vite.config.ts` の `base` はリポジトリ名の下にする。サーバー側に送る設定がないので、どの URL でも `index.html` が返るよう、deploy が `404.html` も置く（理由は `deploy.yml`）
- 毎朝の取得のワークフローは、取得して `data/` をコミットしたあと、`deploy.yml` を呼んで出し直す（理由は `deploy.yml`）

## データ

<!-- 保存するものの持ち方（テーブルなど）と、その理由・前提 -->

## どこでも守る決まり

<!-- 複数のファイルで守る決まり。命名、エラーの扱い、コードの書き方を縛るライブラリの注意など -->
