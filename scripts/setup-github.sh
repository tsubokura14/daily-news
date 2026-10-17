#!/usr/bin/env bash
# GitHub リポジトリの初期設定（gh CLI でログインし、このリポジトリを GitHub に push 済みであること）
set -euo pipefail

# 取り込み方法を Squash merge だけにし、取り込んだブランチを自動で消す
gh repo edit \
  --enable-squash-merge \
  --enable-merge-commit=false \
  --enable-rebase-merge=false \
  --delete-branch-on-merge

# Squash merge のコミットメッセージを「PR のタイトル」と「PR の本文」にする
gh api --method PATCH "repos/{owner}/{repo}" \
  -f squash_merge_commit_title=PR_TITLE \
  -f squash_merge_commit_message=PR_BODY \
  --silent

# main を、PR を通さないと入れないようにする。一人でも自分の PR をマージできるよう、承認の数は0にする
# 非公開リポジトリで GitHub Free の場合は使えないので、そのときは手元の Git のフック（.githooks/pre-push）だけが守りになる
# フックは最後に呼ぶ link-template.sh が最初に有効にする（途中で失敗しても有効になる）。link-template.sh を先に呼ぶと、そこで失敗したときに GitHub の設定まで止まるので、最後のままにする
# CI はまだないので、必須のチェックは空にする。ここで設定できたら、CI を作ったとき（docs/how-we-work.md の立ち上げ S4）に、そのジョブを必須にする
if gh api --method PUT "repos/{owner}/{repo}/branches/main/protection" --input - --silent 2>/dev/null <<'EOF'
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null
}
EOF
then
  echo "main のブランチ保護を設定しました。"
else
  echo "main のブランチ保護は使えませんでした（非公開リポジトリで GitHub Free の場合）。main への push は手元のフックで止めます。"
fi

# 秘密情報を含む push を、GitHub でも断る（secret scanning の push protection）
# 非公開リポジトリでは有料（GitHub Secret Protection）なので、使えなければ手元のフックだけが守りになる
if gh api --method PATCH "repos/{owner}/{repo}" --input - --silent 2>/dev/null <<'EOF'
{
  "security_and_analysis": {
    "secret_scanning": { "status": "enabled" },
    "secret_scanning_push_protection": { "status": "enabled" }
  }
}
EOF
then
  echo "秘密情報を含む push を、GitHub でも断るようにしました。"
else
  echo "GitHub の push protection は使えませんでした（非公開リポジトリで有料の機能がない場合）。秘密情報を含む push は手元のフックで止めます。"
fi

echo "GitHub の設定が終わりました。"

# Git のフックを有効にし、元になったテンプレートとつなぐ（テンプレートで直したものを取り込み、ここで直した不備をテンプレートに集めるため）
bash "$(dirname "$0")/link-template.sh"
