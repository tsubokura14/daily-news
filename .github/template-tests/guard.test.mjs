// .claude/hooks/guard.mjs のテスト。「コマンド → 止める／通す」の表を、使われ方（メインの会話・pr-check・test-runner）ごとに試す
// 各行の最後は、その行を足すきっかけ（Issue の番号。「最初から」は Issue より前からある決まり）。壊れたら、その Issue で理由をたどる
// todo を付けた行は、直ってほしい結果で書いた、まだ直していないもの（失敗しても全体は通る）
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GUARD = path.resolve(import.meta.dirname, "../../.claude/hooks/guard.mjs");
const 止める = 2;
const 通す = 0;

const tempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "guard-test-"));

// .env のワイルドカードの判定は、cwd のフォルダにあるファイルで変わる。作業フォルダのファイルで結果が変わらないよう、空のフォルダを渡す
const emptyDir = tempDir();

// フックが実際に呼ばれるときと同じ形（標準入力の JSON と引数）で起こし、終了コードを返す
function guard(input, args = [], env = process.env) {
  return spawnSync(process.execPath, [GUARD, ...args], { input: JSON.stringify(input), env, encoding: "utf8" }).status;
}

function table(rows, { agent, cwd = emptyDir } = {}) {
  for (const [command, expected, origin, options = {}] of rows) {
    const name = `${expected === 止める ? "止める" : "通す"}（${origin}）：${command.replace(/\r?\n/g, "⏎")}`;
    test(name, { todo: options.todo }, () => {
      const input = { hook_event_name: "PreToolUse", tool_name: options.tool || "Bash", tool_input: { command }, cwd: options.cwd || cwd };
      assert.equal(guard(input, agent ? [agent] : []), expected);
    });
  }
}

describe("メインの会話", () => {
  describe("Git のフックを外す・飛ばす", () => {
    table([
      ["git push --no-verify", 止める, "最初から"],
      ["git commit --no-verify -m x", 止める, "最初から"],
      ["git -c core.hooksPath=/dev/null push", 止める, "最初から"],
      ["git config core.hooksPath /dev/null", 止める, "最初から"],
      ["GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git push", 止める, "#42"],
      [`GIT_CONFIG_PARAMETERS="'core.hooksPath=/dev/null'" git push`, 止める, "#42"],
      [`export GIT_CONFIG_PARAMETERS="'core.hooksPath=/dev/null'"`, 止める, "#42"],
      [`$env:GIT_CONFIG_PARAMETERS="'core.hooksPath=/dev/null'"; git push`, 止める, "#42", { tool: "PowerShell" }],
      ["git.exe push --no-verify", 止める, "#65"],
      ["& git.exe push --no-verify", 止める, "#65", { tool: "PowerShell" }],
      ["command git push --no-verify", 止める, "#65"],
      ["env git -c core.hooksPath=/dev/null push", 止める, "#65"],
      ["/usr/bin/git -c core.hooksPath=/dev/null push", 止める, "#65"],
      ["git --config-env=core.hooksPath=X push", 止める, "#67"],
      ["git --config-env core.hooksPath=X push", 止める, "#67"],
      ["git status && git push --no-verify", 止める, "#52"],
      ["echo $(git push --no-verify)", 止める, "#52"],
    ]);
  });

  describe(".env を読む", () => {
    table([
      ["cat .env", 止める, "最初から"],
      ["cat apps/web/.env.local", 止める, "#41"],
      ["type .env", 止める, "最初から", { tool: "PowerShell" }],
      ["Get-Content .env", 止める, "最初から", { tool: "PowerShell" }],
      ["git show HEAD:.env", 止める, "最初から"],
      ["grep TOKEN .env", 止める, "最初から"],
      ["cp .env x.txt", 止める, "最初から"],
      ['echo "$(<.env)"', 止める, "#52"],
      ['sort<".env"', 止める, "#52"],
      ["echo `cat .env`", 止める, "#52"],
      ["bash <<'EOF'\ncat .env\nEOF", 止める, "#52"],
      ["@'\nGet-Content .env\n'@ | iex", 止める, "#52", { tool: "PowerShell" }],
      ["cat .env*", 止める, "#65"],
      ["cat .en?", 止める, "#65"],
    ]);
  });

  describe("ふつうの作業は止めない", () => {
    table([
      ["git status", 通す, "#65"],
      ["git diff main...HEAD", 通す, "#65"],
      ["git push -u origin 12-due-date-input", 通す, "最初から"],
      ["cat .env.example", 通す, "#65"],
      ["cat .env.exam*", 通す, "#65"],
      ["cat *.md", 通す, "#65"],
      ['git commit -m "docs: --no-verify (note)"', 通す, "#52"],
      ['git commit -m "説明：core.hooksPath と .env"', 通す, "#42"],
      ['git commit -m "core.hooksPath と .env の説明"', 通す, "#79", { todo: "#79。値が core.hooksPath で始まると止まる" }],
      ['FOO=1 git commit -m "GIT_CONFIG_KEY_0=core.hooksPath を止める"', 通す, "#42"],
      ["git commit -F - <<'EOF'\ncat .env と --no-verify を止める\nEOF", 通す, "#52"],
      ['gh pr create --title x --body "cat .env; git push --no-verify"', 通す, "#52"],
      ["$body = @'\nGet-Content .env\n'@\ngh pr create --body $body", 通す, "#52", { tool: "PowerShell" }],
      ["git config --get core.hooksPath", 通す, "#65", { todo: "#65 の「範囲の外」。読むだけでも止まる" }],
    ]);
  });

  test("止める（#65）：そのフォルダにある .env のファイルに当たるワイルドカード", () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, ".env.custom"), "");
    const input = { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "cat .env.cu*" }, cwd: dir };
    assert.equal(guard(input), 止める);
  });
});

describe("pr-check", () => {
  table(
    [
      ["git diff main...HEAD", 通す, "最初から"],
      ["git log --oneline -5", 通す, "最初から"],
      ["git show HEAD", 通す, "最初から"],
      ["git status", 通す, "最初から"],
      ["git diff --output=x.txt main...HEAD", 止める, "#42"],
      ["git status\ntouch pwned", 止める, "#65"],
      ["git status; touch pwned", 止める, "最初から"],
      ["git status && touch pwned", 止める, "最初から"],
      ["git diff main...HEAD > x.txt", 止める, "最初から"],
      ["git log $(touch pwned)", 止める, "最初から"],
      ["git push", 止める, "最初から"],
      ["cat README.md", 止める, "最初から"],
    ],
    { agent: "pr-check" },
  );
});

describe("test-runner", () => {
  table(
    [
      ["npm test", 通す, "最初から"],
      ["npx playwright test", 通す, "最初から"],
      ["npm test 2>&1", 通す, "最初から"],
      ["npx playwright test --update-snapshots", 止める, "最初から"],
      ["npx vitest -u", 止める, "最初から"],
      ["git add .", 止める, "最初から"],
      ["git commit -m x", 止める, "最初から"],
      ["rm -rf dist", 止める, "最初から"],
      ["npm test > out.txt", 止める, "最初から"],
      ['npx vitest -t "a > b"', 通す, "#65", { todo: "#65 の「範囲の外」。引用符の中の > でも止まる" }],
    ],
    { agent: "test-runner" },
  );
});

describe("会話の始め", () => {
  // GIT_CEILING_DIRECTORIES：一時フォルダの親が git のリポジトリでも、その設定を書き換えないように
  const start = (dir) =>
    guard({ hook_event_name: "SessionStart", cwd: dir }, [], { ...process.env, CLAUDE_PROJECT_DIR: dir, GIT_CEILING_DIRECTORIES: path.dirname(dir) });

  test("Git のフック（.githooks/）を有効にする", () => {
    const dir = tempDir();
    execFileSync("git", ["init", "--quiet", dir]);
    assert.equal(start(dir), 通す);
    assert.equal(execFileSync("git", ["-C", dir, "config", "core.hooksPath"], { encoding: "utf8" }).trim(), ".githooks");
  });

  test("git のリポジトリでないフォルダで、設定に失敗しても、作業は止めない", () => {
    assert.equal(start(tempDir()), 通す);
  });
});
