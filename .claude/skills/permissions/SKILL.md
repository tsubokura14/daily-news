---
name: permissions
description: 権限の決め方。.claude/settings.json の allow・ask・deny、フック（.claude/hooks/）、Git のフック（.githooks/）を変えるとき、確認の出し方を見直すときに使う
user-invocable: false
---

# 権限の決め方

`.claude/settings.json` の allow（確認なし）・ask（確認する）・deny（実行させない）と、フックで止めるものを決めるときの基準。**AIは案を出し、決めるのは人間。** 変えたら PR でレビューする。

中身の良し悪しは、ターミナルの確認ではなく、GitHub の PR のレビューで見る。確認を重ねると見ずに押すようになり、本当に止めるべき確認まで見落とすため。

## 4つの問い

コマンドごとに、次を問う。

1. **取り消せるか**：作業が消える、外に送ったものが残る、なら取り消せない
2. **自分以外に届くか**：通知、公開、外部のサービスへの書き込み
3. **ほかの仕組みで止まっているか**：deny、フック（`.claude/hooks/guard.mjs`、`.githooks/`）。GitHub のブランチ保護は数えない（非公開のリポジトリで GitHub Free だと使えないため）
4. **確認の画面で、人間が良し悪しを判断できるか**：画面に出るのはコマンドの1行だけ

## 決め方

| 当てはまり | 扱い |
| --- | --- |
| AIに決してさせない（マージ、フックを外す、秘密情報を読む） | deny と、フック |
| 1か2に当たり、3で止まっておらず、4で判断できる | ask |
| 1か2に当たるが、4で判断できない | 仕組みで止める（deny かフック）。ask にはしない（押すだけになるため） |
| どれにも当たらない、または危ない形が3で止まっている | allow |

| 例 | 扱いと理由 |
| --- | --- |
| `git push` | allow。2に当たる（秘密情報を含むコミットは、マージしなくても GitHub に残る）が、4で判断できない。秘密情報・main への push・force push（`+` を付けた refspec を含め、リモートのブランチを書き換える push）は `.githooks/pre-push` で止める。よくある書き方は deny でもすぐに止める |
| `gh pr create` | ask。2に当たり、コマンドに出るタイトルで、AIの作業の区切りと範囲を判断できる |
| `git reset --hard`、変更を捨てる `git switch` | ask。1に当たり、いつ・何を捨てるかを判断できる |
| `gh pr merge` | deny。マージは人間がする |
| `.githooks/` と `package.json` の書き換え（`Edit(...)`） | ask。確認なしの `git commit`・`git push`・`npm test` が中身を、PR のレビューより前に実行するので、1に当たる。`.githooks/` は3の仕組みそのもの。確認の画面に差分が出るので、4で判断できる |
| `.claude/` の書き換え | 書かない。Claude Code が最初から守る場所（保護されたパス）で、確認が出る |

- Bash と PowerShell の両方に、同じものを書く
- `.env` を読ませない deny は、ファイル名を1つずつ書く（`.env.*` とまとめると `.env.example` も読めなくなるため）。別の名前の `.env` ファイルを作ったら書き足す
- 承認のときに「今後も許可」を選ぶと、1回限りのコマンドが `settings.json` に入ることがある。コミットしない（自分だけの設定は `.claude/settings.local.json` に書く）
- この設定は「AIがふだん書くコマンドの形」で判定するので、完全な防御ではない

## 今の設定

| 扱い | コマンド |
| --- | --- |
| allow | Issue・PR・CI の結果・差分・ログを見る、main を最新にする、ブランチを作る、コミットする、作業ブランチに push する、テスト・Lint を実行する |
| ask | PR や Issue を作る・閉じる・ラベルなどを変える、`git reset --hard`、`git clean`、変更を捨てる `git switch`、`.githooks/` と `package.json` の書き換え |
| deny | PR のマージ（`gh api` 経由も）、main への push（`git push origin main`）、force push、`--no-verify`、`.env` を読む |

- main への直接 push の deny は、よくある書き方をすぐに止めるためのもの。push の書き方（`-u`、`HEAD:main`、上流ブランチへの `git push` など）は何通りもあり、コマンドの形では止めきれないので、どの書き方でも確実に止めるのは `.githooks/pre-push`
- テストや Lint のコマンドは、技術に合わせて書き換える（最初は npm の場合で書いてある）

### フック（`.claude/hooks/guard.mjs`）

**確実に止めたいコマンドだけ** を止める。コマンドの形を読み解いて止めるものは、増やすほど、ふつうの作業まで止める誤作動が増えるため。

| 止めるもの | 通すもの |
| --- | --- |
| Git のフックを飛ばす・外すコマンド（`--no-verify`、`core.hooksPath`。`-c` や `--config-env` で渡すものも。環境変数の `GIT_CONFIG_KEY_<n>`・`GIT_CONFIG_PARAMETERS` で変えるものも）。`git.exe`・`/usr/bin/git`・`env git`・`command git`・`& git.exe` と書いたものも | コミットメッセージや PR の本文の中の、同じ文字 |
| `.env` を、ファイルを読むコマンド（`cat`、`Get-Content`、`git show` など）や入力のリダイレクト（`< .env`）で読む。`$(...)` の中や、シェルに渡す heredoc（`bash <<EOF`、`... \| iex`）の中も見る。ワイルドカード（`.env*`、`.en?`）で `.env` に当たりうるものも | `.env.example`（`.env.exam*` のように見本だけに当たる書き方も）。`--env-file` で読み込ませること。引用符の中（コミットメッセージや PR の本文）や、シェルに渡さない heredoc の中の文字 |
| pr-check が、見るだけでない git コマンドを使う（`--output` で書き出すもの、改行で2つ目のコマンドを続けるものも） | 1つずつ実行する `git diff`・`git log`・`git show`・`git status` |
| test-runner が、基準の画像を更新する・git で書き込む・ファイルを消す・動かす・書き出す | テスト・Lint・型チェックのコマンド |

- 会話を始めるたびに、`git config core.hooksPath .githooks` を実行する（clone し直しても main への push が止まるように）
- 過去の `docs/changes/` とプロトタイプのフォルダは、フックでは止めない。`.rgignore`、Claude Code が作業ディレクトリの外を読むときに出す確認、`AGENTS.md` の決まりで守る
- 作業の終わりにテストを走らせるフックは置かない。テストを先に書いて失敗を確かめる途中でも止められてしまうため。テストが通っているかは CI で見る

## 見直すとき

- 機能を仕上げたとき、この機能で出た確認を人間に聞く
  - 断ったことのある確認：役に立っているので残す
  - 毎回そのまま承認した確認：上の4つの問いで、allow か、仕組みで止めるかを考え直す
- 確認なしで実行されて困ったものがあったら：ask か deny、または仕組みで止める
