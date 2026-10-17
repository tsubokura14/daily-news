<!--
この README は、GitHub でリポジトリを見た人向けの説明。
このようなコメントは GitHub では表示されない。
開発の進め方と立ち上げの手順は docs/how-we-work.md にある。
-->

# プロジェクト名

<!-- 何のためのアプリかを1〜2文で -->

<!-- 画面のスクリーンショットや、動いているURLがあれば載せる
![スクリーンショット](docs/images/screenshot.png)
-->

## 主な機能

<!-- 使う人から見てできること。docs/overview.md の「主な機能」から -->

-

## 使っている技術

<!-- docs/overview.md の「技術」から -->

-

## セットアップ

### 必要なもの

<!-- 例：Node.js 22 以上 -->

-

### 手順

```bash
# 例
git clone <リポジトリのURL>
cd <リポジトリ名>
npm install
cp .env.example .env
```

<!-- 環境変数があれば、それぞれ何を入れるかを書く -->

## 開発コマンド

| コマンド | 内容 |
| --- | --- |
| <!-- npm run dev --> | <!-- 開発サーバーを起動 --> |
| <!-- npm test --> | <!-- テストを実行 --> |

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
| `docs/libraries/` | コードを読むために必要なライブラリの前提知識（最初のライブラリを入れたときにできる） |
| [docs/how-we-work.md](docs/how-we-work.md) | 開発の進め方 |
| [AGENTS.md](AGENTS.md) | AIへのルール（Claude Code と GitHub Copilot が読む） |
| [.claude/skills/](.claude/skills/) | AIが作業で使う手順と決まり（テストの基準、画面の撮り方など） |