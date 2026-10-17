#!/usr/bin/env bash
# 使う側のリポジトリを、元になったテンプレートとつなぐ（docs/template-files.md の「テンプレートとのつながり」）
# テンプレートを remote として足し、このリポジトリがテンプレートのどの版から作られたかを .template-version に書き、テンプレートのリポジトリだけで使うものを消す
# 使い方：bash scripts/link-template.sh [<テンプレートの owner/repo>]（省くと、GitHub の「Use this template」の記録から探す）
set -euo pipefail

# main への push、force push、秘密情報を含む push を止める Git のフック（.githooks/）を有効にする
# スクリプトで設定するのはここだけ（新しく作るときは setup-github.sh から呼ばれる）。この設定は clone で引き継がれないので、clone し直したときも、これを実行すれば Claude Code を起動しなくても効く
git config core.hooksPath .githooks

add_remote() {
  local url="https://github.com/$1.git"
  if git remote get-url template >/dev/null 2>&1; then
    git remote set-url template "$url"
  else
    git remote add template "$url"
  fi
  # 使う側からテンプレートへは push しない（直したものは、テンプレートの側から集める）
  git remote set-url --push template no-push
  git fetch --quiet template main
}

# remote は clone で引き継がれないので、clone し直したときは remote だけを足し直す
if [ -f .template-version ]; then
  add_remote "$(tr -d '\r' < .template-version | sed -n 's/^repository=//p')"
  echo ".template-version はもうあるので、remote template だけを足しました。つなぎ直すなら、.template-version を消してから実行してください。"
  exit 0
fi

template="${1:-$(gh api "repos/{owner}/{repo}" --jq '.template_repository.full_name // empty')}"
if [ -z "$template" ]; then
  echo "テンプレートが見つかりませんでした。「Use this template」で作っていないなら、テンプレートを引数で渡してください（例：owner/repo）。" >&2
  exit 1
fi
add_remote "$template"

# 「Use this template」で作ったリポジトリの最初のコミットは、そのときのテンプレートの main と同じ中身になる
# ファイルの中身とパスだけで比べる（実行権限は、Windows で clone し直すと変わることがあるので比べない）
files() { git ls-tree -r --format='%(objectname)%x09%(path)' "$1"; }
root="$(git rev-list --max-parents=0 HEAD | tail -n 1)"
root_files="$(files "$root")"
base=""
for commit in $(git rev-list template/main); do
  if [ "$(files "$commit")" = "$root_files" ]; then
    base="$commit"
    break
  fi
done

if [ -z "$base" ]; then
  echo "最初のコミット（$root）と同じ中身のテンプレートの版が見つかりませんでした。元になった版を選び、.template-version を手で書いてください（書き方は docs/template-files.md）。" >&2
  exit 1
fi

cat > .template-version <<EOF
# このリポジトリが取り込んだテンプレートの版（docs/template-files.md）。手で書き換えない
repository=$template
commit=$base
EOF

echo "テンプレート $template の $(git log -1 --format='%h %cs' "$base") から作られたことを、.template-version に書きました。"

# テンプレートのリポジトリだけで使うもの（docs/template-files.md の「テンプレートだけで使うもの」）を消す。.template-version と一緒にコミットする
git rm -r --quiet --ignore-unmatch -- \
  .claude/skills/template-harvest \
  docs/template-harvest.md \
  docs/template-notes \
  .claude/rules/template-notes.md \
  .github/template-tests \
  .github/workflows/template-tests.yml
echo "テンプレートのリポジトリだけで使うファイルを消しました（git rm 済み）。.template-version と一緒にコミットしてください。"
