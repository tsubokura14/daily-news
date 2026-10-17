<!--
変更の仕様のひな形。コピーして docs/changes/<年-月-日>-<何をするか>.md を作る（例：2026-09-17-add-due-date.md）。
「なぜ」〜「調べたこと」は、AIが下書きし、人間が答えて決める（/dev-spec）。「画面」のスクリーンショットは、プロトタイプで合意したときに足す（/dev-proto）。
「設計」以降はAIが下書きし、人間がレビューする（/dev-spec の続き）。
スクリーンショットは、このファイルと同じ名前のフォルダに置く（例：2026-09-17-add-due-date/list-empty.png）。
-->

# guard.mjs と pre-push の自動テスト（#71）

## なぜ

`.claude/hooks/guard.mjs` と `.githooks/pre-push` にテストがない。guard.mjs はシェルのコマンドを自前で読み解いていて、これまでの12回の変更のうち6回が、抜け道か止めすぎの修正だった（#41、#42、#51、#52、#65、#67）。
確かめるのは直すたびに手で試すしかなく、ある直しが前に直したところを壊していても気づけない。

## 影響する今の仕様

- `docs/template-files.md` の「テンプレートだけで使うもの」（テストとワークフローを足す）
- `scripts/link-template.sh` の、テンプレートとつなぐときに消すパス
- `docs/template-notes/guards.md` の「試すときの前提」
- アプリの仕様（`docs/specs/`）は変わらない

## 使う場面

1. テンプレートを直す人が、guard.mjs に新しい抜け道の対策を足して PR を出すと、GitHub Actions でテストが走る。その直しで、#52 で直した「コミットメッセージの中の `--no-verify` では止めない」が壊れていれば、テストが失敗し、PR にそれが出る
2. テンプレートを直す人が、手元でテストのコマンドを1つ打つと、guard.mjs（メインの会話・pr-check・test-runner）と pre-push のテストがすべて走り、失敗したものだけがわかる
3. 使う側のリポジトリを `scripts/link-template.sh` でテンプレートとつなぐと、テストとワークフローが消え、使う側の PR では走らない

## 受け入れ条件

guard.mjs（メインの会話）

- これまでの Issue（#42、#52、#65、#67）の再現手順にあるコマンドが、すべて止まる
- 止めてはいけないものが通る：コミットメッセージの heredoc、PR の本文や `-m "..."` の中の `.env`・`--no-verify`・`core.hooksPath`、`cat .env.example`、`git status`、`git diff main...HEAD`
- シェルやインタプリタに流す heredoc・here-string の中で `.env` を読むものは止まる

guard.mjs（pr-check・test-runner）

- pr-check：1つの `git diff`・`git log`・`git show`・`git status` は通る。`--output`、改行、`;` などで2つ目のコマンドを付けたもの、ほかのコマンドは止まる
- test-runner：テストのコマンドは通る。基準の画像の更新、git で書き込むコマンド、ファイルを消す・動かす・書き出すコマンドは止まる

guard.mjs（会話の始め）

- 会話を始めると、Git のフック（`.githooks/`）が有効になる。設定に失敗しても、作業は止まらない

pre-push

- main への push が断られる
- リモートのブランチを書き換える push（`-f` も、`+` を付けた refspec も）が断られる
- `.env` のファイルを含む push、トークンの形の文字列を含む push（リネームしたファイルに足したものも含む）が断られる
- ふつうのブランチの push、新しいブランチの push、ブランチを消す push、`.env.example` を含む push は通る

走らせ方

- 手元で、1つのコマンドで guard.mjs と pre-push のテストがすべて走る。Node のほかに入れるものはない
- テンプレートのリポジトリで PR を出す・更新すると、GitHub Actions でテストが走り、結果が PR に出る
- 使う側でテンプレートとつなぐと、テストとワークフローが消える
- `docs/template-notes/guards.md` の「試すときの前提」が、テストの書き方と食い違わない

## 画面

画面は変わらない。

## やらないこと

- guard.mjs・pre-push の止め方を変える（テストを書いて見つかった不備は、別の Issue にする）
- 使う側のリポジトリでテストを走らせる
- `.claude/settings.json` の deny が効くかのテスト（Claude Code が判定するもので、外から試せない）
- `node -e` の中でファイルを読むなど、今も止めないと決めているものを止める
- この仕様ファイルが、使う側でテンプレートとつなぐときに消えるようにする（#77）

## 決まっていないこと

- [x] GitHub Actions は、どの OS で走らせる？ → Ubuntu と Windows の両方（人間とAIが Windows で使っていて、`\` の読み方や Git Bash の違いで結果が変わりうるため）
- [x] #65 の「範囲の外」にある、今の止めすぎ（`git config --get core.hooksPath` が止まる、test-runner で引用符の中の `>` が止まる）は、テストでどう扱う？ → 直ってほしい形で書き、「まだ直していない」印（`todo`）を付けて、失敗しても全体は通す（今の動きのままテストにすると、止めすぎを正しいものとして固めてしまうため）
- [x] テストを書いていて、新しい抜け道や止めすぎが見つかったら？ → この Issue では直さず、`todo` を付けたテストを書き、別の Issue を立てる
- [x] 会話の始め（SessionStart）に `core.hooksPath` を設定し直す動きも、テストに入れる？ → 入れる（壊れると、clone し直したあと pre-push が黙って効かなくなるため）
- [x] テストが失敗した PR を、マージできないようにする？ → しない。このリポジトリは非公開で GitHub Free のため、ブランチの保護もルールセットも使えない（2026-10-12 に API で確かめた。403）。失敗は PR のチェックの表示で気づく
- [x] 手元でテストを走らせるコマンドは、どこに書く？ → `docs/template-notes/guards.md` の「試すときの前提」（`CLAUDE.project.md` はプロジェクトのものなので、テンプレートのことは書かない）

## 調べたこと

---

## 設計

### 足す・変えるファイル

| ファイル | 中身 |
| --- | --- |
| `.github/template-tests/guard.test.mjs`（新規） | guard.mjs のテスト |
| `.github/template-tests/pre-push.test.mjs`（新規） | pre-push のテスト |
| `.github/workflows/template-tests.yml`（新規） | PR ごとに、Ubuntu と Windows でテストを走らせる |
| `docs/template-files.md` | 「テンプレートだけで使うもの」に、上の2つ（`.github/template-tests/`、`.github/workflows/template-tests.yml`）を足す |
| `scripts/link-template.sh` | 消すパスに、上の2つを足す |
| `docs/template-notes/guards.md` | 「試すときの前提」に、テストの走らせ方と書き方の前提を書く |

- 追加で入れるパッケージはない（`node:test`、`node:assert`、`node:child_process` だけ）。`package.json` も作らない
- 手元で走らせるコマンド：`node --test ".github/template-tests/*.test.mjs"`（Node 24 で、引用符の中のワイルドカードを Node が展開し、`todo` のテストが失敗しても終了コードは 0 になることを確かめた）

### 置き場所

`.github/template-tests/` に置く。

- 比べた案：ルートの `template-tests/`（使う側で `link-template.sh` を実行するまで、アプリのフォルダと並んでルートに出る）、対象の隣の `.claude/hooks/guard.test.mjs`・`.githooks/pre-push.test.mjs`（どちらも「テンプレートのもの」のフォルダなので、集める・取り込むときに `:(exclude)` が要る。`.githooks/` の編集は確認も出る）
- 選んだ理由：ワークフローの近くにまとまり、`.github/` の下で「テンプレートのもの」なのは決まったパスだけなので、除外の指定が要らない

### guard.mjs のテスト

- `node .claude/hooks/guard.mjs [pr-check|test-runner]` を子プロセスで起こし、標準入力に `{"hook_event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"..."},"cwd":"<空の一時フォルダ>"}` を渡して、終了コード（止める = 2、通す = 0）を見る。フックが実際に呼ばれるときと同じ形で試すため
  - シェルを通さずに渡すので、Git Bash のパスの書き換え（`MSYS_NO_PATHCONV=1` の話）は起きない
  - `cwd` を空の一時フォルダにするのは、`.env` のワイルドカードの判定が、そのフォルダにあるファイルで変わるため（今の作業フォルダのファイルで結果が変わらないように）
- 「コマンド → 止める／通す」の表を、使われ方（メインの会話・pr-check・test-runner）ごとに配列で書き、1行を1つのテストにする。各行に、元になった Issue の番号を書く（壊れたときに、なぜその行があるかをたどるため）
- `tool_name` は、代表として `Bash` で試す。`PowerShell` は、PowerShell の書き方（here-string、`$env:`、`\` をエスケープとして読まない）の行だけ `PowerShell` にする
- 止めすぎ（#65 の「範囲の外」と、書いていて見つかったもの）は、直ってほしい結果で書き、`todo: "#<Issue番号>"` を付ける
- 会話の始め：`hook_event_name: "SessionStart"` と、環境変数 `CLAUDE_PROJECT_DIR` に一時的な git のリポジトリを渡し、`git config core.hooksPath` が `.githooks` になることを見る。git のリポジトリでないフォルダを渡したときに、終了コードが 0 になることも見る

### pre-push のテスト

- テストごとに、一時フォルダに送り先の bare リポジトリと手元のリポジトリを作る。手元のリポジトリの `core.hooksPath` を、このリポジトリの `.githooks` の絶対パスにして、実際に `git push` する。push の書き方（`+` の refspec など）を Git が pre-push に渡す形に直すところまで含めて試すため
  - 最初の main は、フックを有効にする前に push しておく（main への push は断られるため）
  - コミットする人の名前とメールは、テストの中で `-c user.name=... -c user.email=...` で渡す（CI と手元の設定に左右されないように）
- 見る項目：断られること（終了コードが 0 以外）と、送り先にブランチが入っていないこと
- トークンの形の文字列は、テストのファイルにそのまま書かず、実行するときに組み立てる（例：`"ghp_" + "a".repeat(36)`）。そのまま書くと、このテストのファイルを push するときに、pre-push 自身と GitHub の push protection に止められるため
  - この理由は、テストのファイルのコメントに書く（そのファイルだけに関わるため）

### GitHub Actions

- `pull_request` で、`ubuntu-latest` と `windows-latest` の2つで走らせる。Node は 24（今の手元と同じ。LTS）
- 使うアクションは、`actions/checkout` と `actions/setup-node`。書くときに、その時点のメジャーバージョンを公式で確かめる
- 非公開リポジトリの Actions は、無料の枠（月 2,000 分）の中で動く。Windows は2倍で数えるが、テストは数十秒の見込みなので足りる
- 失敗してもマージは止まらない（ブランチの保護が使えないため。「決まっていないこと」を参照）

### 理由の残し場所

- 置き場所・テストの形・Ubuntu と Windows の両方で走らせる理由・使う側で消す理由：`docs/template-notes/guards.md`（テンプレートの作りを変えるときだけ要る理由のため。`docs/design.md` はプロジェクトのもの）
- トークンを組み立てる理由、`cwd` を空にする理由：それぞれのテストのファイルのコメント
- `docs/template-files.md` の表には、中身を1行だけ書く

## 確かめ方

- guard.mjs（メインの会話・pr-check・test-runner・会話の始め）の受け入れ条件：テスト（このテストそのもの。表の行が受け入れ条件の各項目を覆っているかは、PR のレビューで表を見て確かめる）
- pre-push の受け入れ条件：テスト（同上）
- 1つのコマンドで、guard.mjs と pre-push のテストがすべて走る：触って確かめる（手元の Windows で、上のコマンドを打つ）
- PR で GitHub Actions が走り、結果が出る：触って確かめる（タスク3の PR に、Ubuntu と Windows の2つのチェックが出る）
- 使う側でテンプレートとつなぐと、テストとワークフローが消える：コードを見て確かめる（`scripts/link-template.sh` の消すパスと、`docs/template-files.md` の表が一致している）
- `docs/template-notes/guards.md` が、テストの書き方と食い違わない：コードを見て確かめる

## タスク

- [x] 1. guard.mjs のテスト（メインの会話・pr-check・test-runner・会話の始め）が手元で1つのコマンドで走り、`.github/template-tests/` が「テンプレートだけで使うもの」として一覧と `link-template.sh` に入り、`guards.md` に走らせ方が書かれたら完了
- [x] 2. pre-push のテストが、同じコマンドで一緒に走ったら完了
- [x] 3. PR ごとに Ubuntu と Windows で GitHub Actions がテストを走らせ、ワークフローが「テンプレートだけで使うもの」として一覧と `link-template.sh` に入ったら完了（最後の PR。`Closes #71`）
