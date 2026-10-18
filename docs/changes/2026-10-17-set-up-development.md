<!--
変更の仕様のひな形。コピーして docs/changes/<年-月-日>-<何をするか>.md を作る（例：2026-09-17-add-due-date.md）。
「なぜ」〜「調べたこと」は、AIが下書きし、人間が答えて決める（/dev-spec）。「画面」のスクリーンショットは、プロトタイプで合意したときに足す（/dev-proto）。
「設計」以降はAIが下書きし、人間がレビューする（/dev-spec の続き）。
スクリーンショットは、このファイルと同じ名前のフォルダに置く（例：2026-09-17-add-due-date/list-empty.png）。
-->

# 開発を始められる（#1）

## なぜ

テストを先に書いて開発を進められる土台（ひな形・テスト・本番のトークン・画面を撮る仕組み・CI・編集後のフック）がまだなく、機能の Issue に取りかかれないため。

## 影響する今の仕様

- なし（`docs/specs/` に書く動きはない）
- 仕上げで書くもの：`docs/overview.md` の「技術」、`docs/design.md` の「全体の構成」、`CLAUDE.project.md` の「技術」「よく使うコマンド」、`docs/ui.md` の「トークン」（本番のトークンファイルの場所）、`README.md`

## 使う場面

1. AI が機能のタスクに取りかかるとき、受け入れ条件のテストを先に書いてコマンド1つで実行し、失敗することを確かめてから実装に進める
2. 開発する人が画面のタスクの PR を出すと、テスト・Lint・型チェック・画面の画像を比べるテストが自動で走り、結果が PR に出る。画像が変わっていたら、基準・今回・差分の画像を PR から見られる
3. AI がファイルを編集すると、そのファイルだけが自動で整形され、Lint がかかる。失敗しても作業は止まらない

## 受け入れ条件

- 手元で、コマンド1つでアプリの表示ページを立ち上げ、ブラウザで開ける
  - ページには、ページの地の色の上に、アプリ名「Daily News」だけを題字の書体で出す（トークンと書体が効いていることを、画面を撮って確かめるため。最初の画面の Issue で置き換える）
- 手元で、コマンド1つでテストを実行できる。失敗するテストを書くと失敗し、直すと通る
  - 取得・要約のスクリプト側のテストも、表示ページ側のテストも実行できる
  - ブラウザで画面を操作するテストも実行できる
- 手元で、Lint と型チェックをそれぞれコマンド1つで実行できる
- トークン（色・余白・文字）が本番のファイル1か所にだけあり、表示ページから使える。`docs/tokens.css` はなくなり、`docs/ui.md` の「トークン」に本番のファイルの場所が書かれている
  - ライトとダークの両方の値が使える
- 手元で、コマンド1つで本番の画面を撮り直せ、別のコマンドで基準の画像と比べられる
  - 撮った画像は `docs/specs/screens/<画面>-<状態>.png` に置かれる。手元（Windows）と CI で同じ画像になる
  - 日付など撮るたびに変わるものは固定され、2回続けて撮っても同じ画像になる
  - 撮るときに立ち上げるサーバーのポートを、指定して変えられる。指定しなければ既定のポートを使う
- PR を出すと、テスト・Lint・型チェック・画像を比べるテストが自動で走り、結果が PR に出る
  - 画像を比べるテストが失敗したら、基準・今回・差分の画像を PR の結果から取り出せる
  - CI では基準の画像を更新しない
- main にマージすると、表示ページが公開の URL に出る。手で実行して出し直すこともできる
  - 毎朝の取得の仕組み（あとの Issue で作る）から、同じデプロイを呼び出せる
- AI がファイル（コード）を編集すると、そのファイルだけが自動で整形され、Lint がかかる
  - 対象でない種類のファイル（`.md`、画像など）では何もしない
  - 整形や Lint が失敗しても、AI の作業は止まらない
  - Windows で動く
- テストのファイルを編集するときに、テストの基準（`.claude/rules/testing.md`）が読み込まれる
- `README.md` に、GitHub で見た人向けに、何のアプリか、手元での立ち上げ方、よく使うコマンドが書かれている
- `docs/overview.md` の「技術」、`CLAUDE.project.md` の「技術」「よく使うコマンド」、`docs/design.md` の「全体の構成」が、作ったものと合っている

## 画面

画面はない（プロトタイプは作らない）。

## やらないこと

- 機能（記事の取得・要約・一覧の画面・ログイン・キーワード設定など）。それぞれの Issue で作る
- 毎朝の取得の定期実行（取得の機能の Issue で作り、最後にこの Issue のデプロイを呼ぶ）
- DB とログインの仕組みを動かすこと（この Issue では使う技術を選ぶだけ。作るのはログイン・印・キーワード設定の Issue）
- ひな形やライブラリそのものの動きのテスト

## 決まっていないこと

- [x] `docs/overview.md` では「キーワードの設定と印は DB に置き、Google アカウントでログインして、スマホと PC でそろう」となっていますが、Issue では「DB は使わない。`data/*.json` で代わりにする」「GitHub Pages（静的なファイル）」となっています。静的なページだけでは、ログインと、ブラウザからの印の保存・同期ができません。どちらに合わせますか？（例：記事は JSON のまま、ログインと印・キーワードだけ外部のサービス〈Firebase、Supabase など〉に置く／overview を直して、ログインと印をやめる・後回しにする）。土台で選ぶのは技術だけで、作るのはそれぞれの機能の Issue です → `docs/overview.md` が正しい。記事は JSON のファイルに置き、キーワードの設定と印は DB に置く。どの DB・ログインの仕組みにするかは「設計」で選ぶ
- [x] リポジトリは非公開です。GitHub Pages は、非公開のリポジトリでは GitHub Pro 以上が要ります（無料のままなら公開にする）。overview の「記事の一覧は公開のページとして誰でも読める」と合わせて、どうしますか？（リポジトリを公開にする／Pro にする／デプロイ先を変える） → リポジトリを公開にした
- [x] 土台に、空のページを GitHub Pages に出すところ（デプロイ）まで含めますか？ それとも、デプロイは毎朝の取得の Issue で、取得と1つのワークフローとして作りますか？（Issue の注意にあるとおり、取得からデプロイまでを1つのワークフローにする前提） → 含める。ほかのワークフローから呼び出せる形にし、毎朝の取得のワークフローが最後に呼ぶ。Pages の設定のつまずきを早く見つけ、Google ログインに登録する公開の URL を早く決めるため
- [x] 複数のタスクを並べて進める（worktree などでフォルダを分ける）予定はありますか？ あれば、撮るときに立ち上げるサーバーのポートをフォルダごとに変えられるようにします → 予定に関わらず、ポートを変えられるようにする（指定しなければ既定のポート）。手間がほとんどかからないため
- [x] 手元に Docker Desktop は入っていますか？（画面を撮り直すのに要ります） → 入っている

## 調べたこと

2026-10-17 に公式のページと npm で確かめた。

- 要約の AI の料金（100万トークンあたり）
  - Gemini：3.1 Flash-Lite と 2.5 Flash-Lite は無料枠あり。無料枠では、送った内容が Google の製品の改善に使われる。無料枠の回数の上限は公式のページに載っておらず、AI Studio で見る。有料なら、2.5 Flash-Lite は入力 $0.10・出力 $0.40、3.1 Flash-Lite は入力 $0.25・出力 $1.50
  - Claude Haiku 5.5：入力 $0.10・出力 $0.50（10万トークンまでのプロンプト）
- Firebase の無料の Spark プラン：Firestore は1日に読み取り5万回・書き込み2万回まで、保存は 1GiB まで。Authentication は月5万人まで無料
- Supabase の無料プラン：1週間使われないと、プロジェクトが止まる
- 今の版：Vite 8.3、React 19.3、Tailwind CSS 4.3、Vitest 5.0、Playwright 1.64.1、Biome 2.5、React Router 8.4、TypeScript 7.0（create-vite の React のひな形は TypeScript 6.0）
- Playwright 公式の Docker イメージ：`mcr.microsoft.com/playwright:v<版>-noble`。入れた Playwright と版をそろえる。`--ipc=host` と `--init` を付けて動かす
- GitHub Pages の公式のデプロイ：`actions/configure-pages`、`actions/upload-pages-artifact`、`actions/deploy-pages`。権限は `contents: read`、`pages: write`、`id-token: write`。`https://<ユーザー>.github.io/<リポジトリ>/` に出すときは、Vite の `base` を `/<リポジトリ>/` にする
- GitHub Pages には、どの URL でも `index.html` を返す設定がない

---

## 設計

### 技術

| 用途 | 選んだもの | 理由 | 比べた候補と選ばなかった理由 |
| --- | --- | --- | --- |
| 言語 | TypeScript（ひな形と同じ 6.0 系） | 取得・要約のスクリプトと表示ページで、記事の JSON の型を共有できる | Python：記事の本文を取り出すのは得意だが、表示ページと型を共有できず、Node と2つ用意することになる。TypeScript 7.0：出たばかりで、ひな形と周りの道具がまだ 6.0 のため |
| 表示ページ | Vite + React | 静的なファイルを出すだけの作りに素直に合い、軽く、設定が少ない | Next.js（静的書き出し）：Pages ではサーバーの機能を使えず、使わない仕組みと制約が多い。Astro：ログインと印はブラウザ側の React で作るので、作りが2つに分かれる |
| 画面の切り替え | React Router（`/saved` の形の URL）。最初に画面が2つになる Issue で入れる | URL が読みやすく、サーバーのある場所へ移っても URL が変わらない | HashRouter（`/#/saved`）：工夫なしで動くが、URL に `#` が入り、あとで変えるとブックマークが変わる |
| 見た目 | Tailwind CSS v4 | 立ち上げのトークンが Tailwind v4 の `@theme` で書かれている | — |
| 書体 | Fontsource で同梱（Noto Sans JP、Noto Serif JP、Fraunces の SOFT 軸入り） | 画面を撮るときに外の通信が要らず、Docker の中でも毎回同じ画像になる。版を固定できる | Google Fonts：撮るたびに外へ取りに行き、遅いときや書体が更新されたときに、比べるテストが偶然失敗する |
| DB・ログイン | Firebase（Authentication の Google ログイン、Firestore）。使う機能の Issue で入れる | 静的なページから直接読み書きでき、自分のアカウントだけに絞る決まり（セキュリティルール）も書ける。無料のまま、使わない日が続いても止まらない | Supabase：SQL で書けるが、無料のプロジェクトは1週間使われないと止まる。Google ログインに Google Cloud 側の設定が別に要る |
| 要約の AI | Gemini の Flash-Lite 系の無料枠。取得の Issue で入れる | 0円。記事は公開のものなので、送った内容が改善に使われても問題が小さい。上限が減って止まる日は、仕様の「AI を使えなかった日」の表示で読める | Claude Haiku 5.5：止まる心配は少ないが、月 $1 前後かかる |
| テスト | Vitest（jsdom と Testing Library）、Playwright | Vitest は Vite の設定をそのまま使える。画面の部品は jsdom で速く試し、ブラウザでの操作と画面の画像は Playwright で確かめる | Vitest のブラウザモード：本物のブラウザで正確だが、遅く、Playwright と役割が重なる |
| 整形・Lint | Biome | 整形と Lint が1つの道具で、速いので編集のたびにフックで走らせても待たない | ESLint + Prettier：プラグインと情報は多いが、道具が2つになり、設定とフックのコマンドが増える |
| 型チェック | `tsc`（出力なし） | — | — |
| 定期実行・CI | GitHub Actions | リポジトリと同じ場所で、cron と手動実行と PR のチェックができる | Cloud Run Jobs：この規模には重い |
| デプロイ先 | GitHub Pages（`https://tsubokura14.github.io/daily-news/`） | 静的なファイルを無料で出せる | Vercel：記事以外にストレージが別に要る。サーバーの処理が要るようになったら移る候補 |
| パッケージ管理 | npm | Node に付いていて、何も足さずに済む | — |

### 構成

| 場所 | 置くもの |
| --- | --- |
| `index.html`、`vite.config.ts` | 表示ページの入口と設定（Vite の決まりの場所） |
| `src/web/` | 表示ページ（React）。`src/web/styles/` にトークンと書体の読み込み |
| `src/batch/` | 取得・要約のスクリプト（取得の Issue で作る） |
| `src/shared/` | 表示ページとスクリプトの両方が使うもの（記事の JSON の型など） |
| `data/` | 記事の JSON（取得の Issue で作る） |
| `e2e/` | Playwright のテスト。`e2e/screens/` に画面を撮って比べるテスト |
| `docs/specs/screens/` | 画面の画像（比べるテストの基準） |
| `tools/` | 開発のための Node のスクリプト（Docker で撮る、フックで整形する、など）。`scripts/` はテンプレートのものなので分ける |

- Vitest のテストは、試すファイルの隣に `*.test.ts` / `*.test.tsx` で置く
- `src/web/` と `src/batch/` は互いに読み込まない。両方が使うものは `src/shared/` に置く
  - 理由：表示ページの build に Node 用のコード（取得、Firebase の管理用の鍵など）が混ざらないようにするため
- 残す場所：構成と理由は、タスク7で `docs/design.md` の「全体の構成」へ移す

### 本番のトークン（タスク2）

- `docs/tokens.css` を `src/web/styles/tokens.css` へ移し、`docs/tokens.css` は消す。`docs/ui.md` の「トークン」の場所を書き換える
- `src/web/styles/index.css` で、`@import "tailwindcss"`、`tokens.css`、Fontsource の書体を読み込む。Fraunces は SOFT 軸を含む版を読む（どのファイルを読むかは、入れた版の Fontsource のドキュメントで確かめる）
- 書体を同梱した理由は、`index.css` の読み込みのところにコメントで書く

### 画面を撮る仕組み（タスク3）

- 撮るテストは `e2e/screens/` に置き、`<画面>-<状態>.png` を `docs/specs/screens/` に置く（`snapshotPathTemplate` を `docs/specs/screens/{arg}{ext}` にし、OS 名を入れない）
- 撮るのは、手元でも CI でも Playwright 公式の Docker イメージ（`mcr.microsoft.com/playwright:v1.64.1-noble`。Playwright の版と同じにする）の中だけ。手元では `tools/playwright-docker.mjs` が `docker run --rm --ipc=host --init` でリポジトリをマウントして動かす
  - `node_modules` は、Windows のもの（Biome、esbuild などの OS ごとのバイナリ）を使わず、名前付きのボリュームに Linux 用を入れる（`npm ci` はボリュームが空のときと、`package-lock.json` が変わったときだけ）
  - 理由はスクリプトの先頭にコメントで書く
- 立ち上げるサーバーのポートは環境変数 `PORT` で変えられ、指定しなければ既定のポート（Vite の既定の 5173）を使う。Playwright の `webServer` と `baseURL` がこれを使う
- 日時は Playwright の clock で固定する。アニメーションは止める（`toHaveScreenshot` の既定）
- 状態（0件、エラー、読み込み中など）は、ブラウザが取りに行く記事の JSON の返事を `page.route` で差し替えて作る（最初の画面の Issue から使う）。残す場所：`docs/design.md`（タスク7）
- このタスクで撮るのは、アプリ名だけの空のページ1枚：`placeholder-default.png`。最初の画面の Issue で消す
- コマンド
  - `npm run test:screens`：Docker の中で、撮って基準と比べる
  - `npm run test:screens:update`：Docker の中で、基準を撮り直す
  - `npm run test:e2e`：手元（Windows）でブラウザの操作のテストを動かす（`e2e/screens/` は除く）

### CI（タスク4）

- `.github/workflows/ci.yml`、`pull_request` で動く
- ジョブ `check`：`npm ci`、`biome ci`、型チェック、Vitest
- ジョブ `e2e`：`container:` に `mcr.microsoft.com/playwright:v1.64.1-noble`。`npm ci` のあと、Playwright のテストをすべて（操作のテストと画像を比べるテスト）動かす。基準は更新しない（`--update-snapshots` を付けない）。失敗したら `playwright-report/` と `test-results/` をアーティファクトに残す
- Docker イメージの版と Playwright の版を同じにすることは、`ci.yml` と `tools/playwright-docker.mjs` の版のところにコメントで書く

### デプロイ（タスク5）

- `.github/workflows/deploy.yml`：`push`（main）、`workflow_dispatch`、`workflow_call` で動く。build して、`dist/index.html` を `dist/404.html` にも写し、`upload-pages-artifact` と `deploy-pages` で出す
  - `404.html` を置く理由（Pages にはどの URL でも `index.html` を返す設定がないため）は、ワークフローのその手順にコメントで書く
  - 毎朝の取得のワークフロー（あとの Issue）は、取得してコミットしたあと、このワークフローを `uses:` で呼ぶ。`GITHUB_TOKEN` での push では別のワークフローが動かないため。この前提は `deploy.yml` の先頭にコメントで書く
- `vite.config.ts` の `base` を `/daily-news/` にする
- リポジトリの設定で、Pages の出し先を「GitHub Actions」にする（人間が設定する。タスク5の PR で頼む）

### 編集したあとのフック（タスク6）

- `.claude/settings.json` の `PostToolUse` に、matcher `Edit|Write` で、`command: node`、`args: ["${CLAUDE_PROJECT_DIR}/tools/format-on-edit.mjs"]` を足す
- `tools/format-on-edit.mjs`：標準入力の JSON から `tool_input.file_path` を読み、Biome が扱う種類（`.ts`、`.tsx`、`.js`、`.mjs`、`.json`、`.css` など）のときだけ、`node_modules/@biomejs/biome` の起動スクリプトを `node` で起動して `biome check --write` をかける。それ以外の種類や、Biome が失敗したときも、終了コード0で終わる
  - 対象の種類かどうかを決める部分は関数に分けて、テストを書く
- `.claude/rules/testing.md` の `paths:` を `src/**/*.test.ts`、`src/**/*.test.tsx`、`e2e/**`、`tools/**/*.test.mjs` にする

### 文書（タスク1とタスク7）

- タスク1：`docs/overview.md` の「技術」の表（選んだものと理由を1行。要約の AI の行を足す）、`CLAUDE.project.md` の「技術」「よく使うコマンド」
- タスク7：`docs/design.md` の「全体の構成」（構成と理由・前提。比べた候補は書かない）、`README.md`、`docs/overview.md` と `CLAUDE.project.md` が今の状態と合っているかの見直し

`docs/design.md` とは食い違わない（まだ何も書かれていない）。

## 確かめ方

| 受け入れ条件 | 確かめ方 |
| --- | --- |
| コマンド1つで表示ページを立ち上げ、開ける。アプリ名だけが題字の書体で出る | 触って確かめる |
| コマンド1つでテストを実行でき、失敗するテストで失敗し、直すと通る（スクリプト側・表示ページ側・ブラウザの操作） | 触って確かめる（仮のテストを失敗させて通す。仮のテストは残さない） |
| Lint と型チェックをコマンド1つで実行できる | 触って確かめる |
| トークンが本番のファイル1か所だけにあり、ライトとダークの値が使える。`docs/ui.md` に場所が書かれている | コードを見て確かめる。ダークは OS の設定を切り替えて触って確かめる |
| コマンド1つで撮り直せ、別のコマンドで比べられる。手元と CI で同じ画像。2回撮っても同じ | 触って確かめる（2回続けて撮り、差分が出ないこと。CI で比べるテストが通ること） |
| ポートを指定して変えられる | 触って確かめる |
| PR で自動で走り、結果が出る。失敗したら画像を取り出せる。CI で基準を更新しない | 触って確かめる（わざと画像をずらした PR で失敗とアーティファクトを見て、戻す）。基準を更新しないことはコードを見て確かめる |
| main にマージすると公開の URL に出る。手で出し直せる。ほかのワークフローから呼べる | 触って確かめる（公開の URL を開く。直接 `/daily-news/saved` を開いても空のページが出る）。呼べることはコードを見て確かめる |
| 編集したファイルだけが整形され、Lint がかかる。対象でない種類では何もしない。失敗しても止まらない。Windows で動く | 対象の種類かどうかはテスト。整形と止まらないことは、Windows で実際にファイルを編集して触って確かめる |
| テストのファイルの編集で、テストの基準が読み込まれる | コードを見て確かめる |
| `README.md` が書かれている | コードを見て確かめる |
| overview・CLAUDE.project.md・design.md が作ったものと合っている | コードを見て確かめる |

## タスク

- [x] 1. ひな形とテスト：表示ページを立ち上げられ、Vitest・Playwright（手元の操作のテスト）・Biome・型チェックをそれぞれコマンド1つで実行でき、`docs/overview.md` の「技術」と `CLAUDE.project.md` の「技術」「よく使うコマンド」が書かれたら完了
- [x] 2. 本番のトークン：トークンが `src/web/styles/tokens.css` だけにあり、同梱した書体とともに読み込まれ、ページにアプリ名が題字の書体で出て、`docs/tokens.css` が消え、`docs/ui.md` の「トークン」が書き換わったら完了
- [x] 3. 画面を撮る仕組み：Docker の中で `placeholder-default.png` を撮り直すコマンドと比べるコマンドが動き、ポートを変えられ、`CLAUDE.project.md` にコマンドが足されたら完了
- [x] 4. CI：PR で `check` と `e2e` のジョブが走り、画像を比べるテストが失敗したらレポートがアーティファクトに残るようになったら完了
- [x] 5. デプロイ：main にマージすると空のページが `https://tsubokura14.github.io/daily-news/` に出て、手でも、ほかのワークフローからも出せるようになったら完了
- [x] 6. 編集したあとのフック：Windows で、ファイルを編集すると、そのファイルだけに Biome がかかり、対象でない種類と失敗では何もせず止まらず、`.claude/rules/testing.md` の `paths:` が合わせられたら完了
- [x] 7. 仕上げ：`README.md` と `docs/design.md` の「全体の構成」が書かれ、`docs/overview.md` と `CLAUDE.project.md` が今の状態と合ったら完了
