# テンプレートのファイルとプロジェクトのファイル

このリポジトリのファイルを、テンプレートのもの・両方が書くもの・プロジェクトのものに分ける。
使う側のリポジトリで直した不備をテンプレートに集めるときと、テンプレートで直したものを使う側に取り込むときに、どのファイルを対象にするかをこの一覧で決める。

パスは git の pathspec の書き方で書く（そのまま `git diff <範囲> -- <パス>` に渡せる）。

## テンプレートのもの

集める・取り込むの対象。使う側では、テンプレートの不備を直すときだけ変える。

| パス | 中身 |
| --- | --- |
| `AGENTS.md` | AIへのルール。Claude Code と GitHub Copilot が読む（このプロジェクトだけのものは `CLAUDE.project.md`） |
| `CLAUDE.md` | Claude Code の読み込み口（AGENTS.md などを取り込む） |
| `.claude/agents/` | サブエージェント |
| `.claude/hooks/` | フック |
| `.claude/skills/` | スキル（手順スキルと知識スキル） |
| `.claude/rules/design-notes.md` | ファイルを触ったときのルール |
| `.claude/rules/permissions.md` | |
| `.claude/rules/screenshots.md` | |
| `.githooks/` | Git のフック |
| `.github/ISSUE_TEMPLATE/` | Issue と PR のひな形 |
| `.github/pull_request_template.md` | |
| `docs/how-we-work.md` | 開発の進め方 |
| `docs/template-files.md` | この一覧 |
| `docs/changes/_template.md` | 変更の仕様のひな形 |
| `docs/specs/_template.md` | 今の仕様のひな形 |
| `scripts/setup-github.sh` | GitHub の設定 |
| `scripts/link-template.sh` | テンプレートとつなぐ |

## 両方が書くもの

集める・取り込むの対象だが、プロジェクトの技術に合わせて書き足すので、1つの変更ごとにどちらのものかを人間が決める。

| パス | プロジェクトが書き足すもの |
| --- | --- |
| `.claude/settings.json` | 技術に合わせたテスト・Lint のコマンド、編集したあとのフック |
| `.claude/rules/testing.md` | `paths:`（テストのファイルの置き場所） |
| `.gitignore` | 依存・ビルド成果物など、技術で決まるもの |
| `.gitattributes` | 技術で決まるファイルの扱い |
| `.rgignore` | 検索から外したいもの |

- `.claude/settings.json` は分けられない。Claude Code の設定のうち、Git に入れて共有できるのはこのファイルだけのため（`.claude/settings.local.json` は Git に入らない）
- ほかのファイルも、プロジェクトが書き足す部分と、テンプレートの部分が同じファイルにある。分けるとファイルが増えるわりに、ぶつかる量は少ないので分けない

## テンプレートだけで使うもの

テンプレートのリポジトリで、使う側から集めるため・テンプレートの判断の理由を残すために使うもの。集める・取り込むの対象にしない（上の「テンプレートのもの」に含まれるパスは、`:(exclude)<パス>` で外す）。「Use this template」で使う側にも写るが、`scripts/link-template.sh` がテンプレートとつなぐときに消す。

| パス | 中身 |
| --- | --- |
| `.claude/skills/template-harvest/` | 使う側で直されたものを集めるスキル |
| `docs/template-harvest.md` | 使う側のリポジトリごとに、最後に見たコミット |
| `docs/template-notes/` | テンプレートの判断の理由（なぜこの形にしたか、とらなかった案） |
| `.claude/rules/template-notes.md` | テンプレートのファイルを変える前に、判断の理由を読ませるルール |
| `.github/template-tests/` | フック（guard.mjs、pre-push）のテスト |
| `.github/workflows/template-tests.yml` | 上のテストを、PR ごとに Ubuntu と Windows で走らせる |

## プロジェクトのもの

上の3つにないファイルは、すべてプロジェクトのもの（アプリのコードなど）。集める・取り込むの対象にしない。

次のファイルは、テンプレートには雛形として入っているが、使う側では中身を書くので、プロジェクトのものとして扱う。テンプレートで雛形を直しても、使う側には取り込まない。

| パス | 中身 |
| --- | --- |
| `.template-version` | 取り込んだテンプレートの版（下の「テンプレートとのつながり」） |
| `CLAUDE.project.md` | このプロジェクトの技術、よく使うコマンド、足したルール |
| `README.md` | GitHub で見た人向けの説明 |
| `docs/overview.md` | 目的、やらないこと、技術、用語 |
| `docs/design.md` | 今の設計 |
| `docs/ui.md` | 見た目の決まり |

## テンプレートとのつながり

使う側のリポジトリは、GitHub の「Use this template」で作る。テンプレートとは別の履歴から始まるので、どの版から作ったか・どの版まで取り込んだかを `.template-version` に記録し、差分はいつもこの版を起点に取る。

```
# このリポジトリが取り込んだテンプレートの版（docs/template-files.md）。手で書き換えない
repository=<テンプレートの owner/repo>
commit=<テンプレートのコミット>
```

- テンプレートは remote `template` として足してある（push はできないようにしてある）。`git fetch template main` で最新を取る
- 使う側で直したもの：使う側の最初のコミットより後で、テンプレートのもの・両方が書くものを変えたコミット。`.template-version` を変えたコミット（テンプレートの新しい版の取り込み）は除く。コミットごとに見るのは、コミットメッセージ（Squash merge なので PR の本文）に直した理由が残っているため。テンプレートのリポジトリで `/template-harvest <owner/repo>` を使って集める
- テンプレートで直したもの：`commit` の版と `template/main` との差分。使う側のリポジトリで `/template-sync` を使って 3-way で当て、取り込んだら `commit` を書き換える。このプロジェクトでは要らない変更は、取り込むときに元に戻す（次の取り込みでは、もう出てこない）
- テンプレートの履歴を merge でつなぐやり方はとらない。PR は Squash merge だけなので、merge でつないでも main では1つのコミットになり、つながりが消えるため

### つなぐ

`scripts/link-template.sh` が、remote `template` を足し、`.template-version` を書き、「テンプレートだけで使うもの」を消す（`git rm`）。

- 新しく作るとき：立ち上げの S2 の `scripts/setup-github.sh` から呼ばれる。消したものは、`.template-version` と一緒に S3 の PR に入る
- すでにあるリポジトリ：`bash scripts/link-template.sh` を実行し、できた `.template-version` と消したものをコミットして PR にする。スクリプトがまだなければ、テンプレートからコピーする
- 「Use this template」で作ったときの記録（GitHub の `template_repository`）からテンプレートを探す。ほかの作り方なら、テンプレートを引数で渡す（`bash scripts/link-template.sh owner/repo`）
- 元になった版は、このリポジトリの最初のコミットと、ファイルの中身とパスがすべて同じテンプレートのコミットを探して決める。見つからなければ止まるので、人間が版を選んで手で書く

## 一覧を直すとき

- テンプレートにファイルを足したら、この一覧のどこかに足す。足さないと、プロジェクトのものとして扱われ、使う側に取り込まれない
- 「テンプレートだけで使うもの」を足したら、`scripts/link-template.sh` の消すパスにも足す
- 使う側で、テンプレートのものにプロジェクトの話を書き足す必要が出たら、そのファイルを分けるか、両方が書くものに移す
