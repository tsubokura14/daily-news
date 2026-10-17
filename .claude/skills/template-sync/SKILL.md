---
name: template-sync
description: 使う側のリポジトリで使う。テンプレートで直したものを取り込み、PR を出す
disable-model-invocation: true
---

テンプレートの新しい版を、このリポジトリに取り込む。**ぶつかったところを、どちらに合わせるかは人間が決める。**

このスキルがまだない使う側のリポジトリでは、`git fetch template main` のあと、`git show template/main:.claude/skills/template-sync/SKILL.md` の手順に沿う（このファイルは作らない。手順4で一緒に入る）。
このスキルがあっても、`git fetch template main` のあと `git show template/main:.claude/skills/template-sync/SKILL.md` がこのファイルと違えば、テンプレートのほうの手順に沿う（テンプレートでファイルを移すと、古い手順では見つからないため）。

1. `.template-version` がなければ止まり、`bash scripts/link-template.sh` を実行するよう伝える。remote `template` がなければ、`bash scripts/link-template.sh` で足し直す
2. main を最新にし、`git fetch template main` を実行する。`.template-version` の `commit` を `<base>` とする。`<base>` と `template/main` が同じなら、取り込むものはないと伝えて終わる
3. `git show template/main:docs/template-files.md` を読み（このリポジトリのものは古いことがある）、対象のパスを決める
   - 「テンプレートのもの」「両方が書くもの」
   - 「テンプレートだけで使うもの」は `:(exclude)<パス>` で外す
4. main から `template-sync` ブランチを作り、テンプレートの差分を当てる
   - 取り込む変更の一覧：`git log --oneline --first-parent <base>..template/main -- <対象のパス>`
   - 当てる：パッチを一度ファイルに書き出してから当てる（PowerShell のパイプやリダイレクトは、日本語とバイナリを壊すため）
     1. `git diff --binary --output=.git/template-sync.patch <base> template/main -- <対象のパス>`
     2. `git apply -3 --index .git/template-sync.patch`
   - 「プロジェクトのもの」のうち、このリポジトリにまだないファイル（テンプレートで新しく足された雛形）は、`git checkout template/main -- <パス>` でコピーする
5. ぶつかったファイル（`git diff --name-only --diff-filter=U`）があれば、ファイルごとに、ぶつかったところと、どちらに合わせるかの案を人間に見せて決めてもらう
   - このリポジトリの側（`ours`）は、使う側で直したか書き足したもの。テンプレートの側（`theirs`）は、テンプレートで直したもの
   - テンプレートが節を別のファイルに移した変更とぶつかったら、このリポジトリで書いた中身を移した先に書く案にする
   - 決まったら直し、`git add <ファイル>` する
6. 取り込んだ変更のうち、このプロジェクトでは要らないものがあるかを人間に聞く。あれば、その部分を元に戻す（次の取り込みでは、もう出てこない）
7. `.template-version` の `commit` を `git rev-parse template/main` に書き換える。ファイルを指定して `git add` し、コミットする
8. `CLAUDE.project.md` の「よく使うコマンド」にテストのコマンドがあれば、サブエージェント `test-runner` に「全部」を渡し、通ることを確かめる。失敗したら止まって伝える
9. PR を出す
   - タイトル：`テンプレートの <template/main の短いハッシュ> までを取り込む`
   - 本文：`.github/pull_request_template.md` に沿う（Issue はないので、`Refs` の行は消す）。「やったこと」に、取り込んだ変更の一覧、ぶつかったところと決めたこと、元に戻した変更とその理由を書く
10. PR の URL を伝える。取り込んだものに `AGENTS.md`・`CLAUDE.md`・`.claude/`（スキル、フック、設定）が含まれていれば、マージしたあとに新しい会話を始めるよう伝える（今の会話には、古いものが読み込まれているため）

**マージはしない。**
