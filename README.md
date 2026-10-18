# Daily News

毎朝、自分が登録したキーワードに関連するニュースを、日本語で手早く把握するためのアプリです。記事は Hacker News から集めて AI が要約し、視野が狭くならないよう、キーワードと関係なく反響の大きかった記事も少し混ぜます。

公開のページ：https://tsubokura14.github.io/daily-news/

> 今は開発の土台ができた段階で、ページにはアプリ名だけが出ます。記事の取得・一覧・ログインなどは、これから作ります。

## 主な機能

- 毎日 JST 7:00 に、Hacker News の注目記事から30件ほどを選び、日本語のタイトルと要約を付けて一覧にする
  - 8割はキーワードに関連する記事、2割はキーワード外で反響の大きい記事
- 日付を切り替えて過去（直近90日）の一覧を読み、カテゴリで絞り込む
- 自分の Google アカウントでログインし、キーワードの設定と、保存・既読・興味なしの印を使う
- 画面の明暗を切り替える

詳しくは [docs/overview.md](docs/overview.md) にあります。

## 使っている技術

TypeScript、Vite + React、Tailwind CSS、Firebase（Authentication、Firestore）、Gemini、Vitest、Playwright、Biome、GitHub Actions、GitHub Pages。
選んだ理由は [docs/overview.md](docs/overview.md) の「技術」にあります。

## セットアップ

### 必要なもの

- Node.js（LTS）と npm
- Docker Desktop（画面の画像を撮る、または基準と比べるときだけ）

### 手順

```bash
git clone https://github.com/tsubokura14/daily-news.git
cd daily-news
npm ci
npm run dev
```

表示されたアドレス（既定は `http://localhost:5173/daily-news/`）をブラウザで開きます。

## 毎朝の取得の設定

記事は、GitHub Actions の `daily`（毎日 JST 7:00 と手動）が取得して、`data/` にコミットし、ページを出し直します。最初に、次の設定をします。

1. GitHub の Settings → Secrets and variables → Actions → Secrets に、`GEMINI_API_KEY`（Google AI Studio で作ったキー）を登録する
   - 登録しないと、AI を使わない英語タイトルの一覧になります
   - モデルを変えるときは、同じ画面の Variables に `GEMINI_MODEL` を登録します（なければ [src/batch/config.ts](src/batch/config.ts) の既定値）
2. Settings → Pages の公開元（Source）が「GitHub Actions」になっていることを確かめる
3. Actions の画面で `daily` を選び、Run workflow で手動で1回動かす。`data/` に一覧がコミットされ、公開のページが更新されます

手元で試すときは、`GEMINI_API_KEY=<キー> node src/batch/main.ts`（キーを付けなければ、英語タイトルの一覧になります）。

### キーワードの直し方

[src/batch/keywords.json](src/batch/keywords.json) を直して、main に取り込みます。変えた内容は、次の朝の取得から使われます（その日の一覧は選び直しません）。

- カテゴリは10個まで、名前は6文字まで
- キーワードごとに `priority` を `high`・`medium`・`low` のどれかにする
- 形が壊れていると、`data/` に何も書かずに取得が失敗します

## 開発コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 表示ページを立ち上げる |
| `npm test` | Vitest を実行する |
| `npm run test:e2e` | ブラウザの操作のテスト（Playwright）を実行する。画面の画像は除く |
| `npm run test:screens` | Docker の中で画面を撮り、`docs/specs/screens/` の基準と比べる |
| `npm run test:screens:update` | Docker の中で、基準の画像を撮り直す |
| `npm run lint` | Lint と整形を確かめる（`npm run lint:fix` で直す） |
| `npm run typecheck` | 型チェック |
| `npm run build` | build する |

撮るときのポートは、環境変数 `PORT` で変えられます（既定は 5173）。

## 開発の進め方

このリポジトリは、**人間が主導するハーネスエンジニアリング** で開発している。
何を作るかを決めること、レビュー、マージは人間がする。AI（Claude Code・GitHub Copilot）は、決まった流れ・決まり・止める仕組み（ハーネス）の中で、設計の下書きと実装をする。
詳しくは [docs/how-we-work.md](docs/how-we-work.md) にある。

## ドキュメント

| ファイル | 内容 |
| --- | --- |
| [docs/overview.md](docs/overview.md) | 目的、やらないこと、技術、用語 |
| [docs/specs/](docs/specs/) | アプリが今どう動くか、今の画面 |
| [docs/design.md](docs/design.md) | アプリが今どう作られているか（複数の場所に関わる決まりと、その理由） |
| [docs/ui.md](docs/ui.md) | 見た目の決まり（色・余白・文字・部品の使い分け） |
| [docs/changes/](docs/changes/) | 機能ごとの変更の記録（何を・なぜ・どう変えたか） |
| [docs/libraries/](docs/libraries/) | コードを読むために必要なライブラリの前提知識 |
| [docs/how-we-work.md](docs/how-we-work.md) | 開発の進め方 |
| [AGENTS.md](AGENTS.md) | AIへのルール（Claude Code と GitHub Copilot が読む） |
| [.claude/skills/](.claude/skills/) | AIが作業で使う手順と決まり（テストの基準、画面の撮り方など） |
