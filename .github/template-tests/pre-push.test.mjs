// .githooks/pre-push のテスト。一時フォルダに送り先（bare）と手元のリポジトリを作り、実際に git push して、断られるか・通るかを見る（この形にした理由は docs/template-notes/guards.md）
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const HOOKS = path.resolve(import.meta.dirname, "../../.githooks").replaceAll("\\", "/");

// トークンの形の文字列は、実行するときに組み立てる。そのまま書くと、このファイルを push するときに、pre-push 自身と GitHub の push protection に止められる
const TOKEN = "ghp_" + "a".repeat(36);

// コミットする人の名前とメールは、CI と手元の設定に左右されないように、毎回渡す
function git(cwd, ...args) {
  return spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", ...args], {
    cwd,
    encoding: "utf8",
  });
}

function run(cwd, ...args) {
  const result = git(cwd, ...args);
  assert.equal(result.status, 0, `git ${args.join(" ")}\n${result.stderr}`);
  return result.stdout.trim();
}

function commit(cwd, file, content) {
  fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
  fs.writeFileSync(path.join(cwd, file), content);
  run(cwd, "add", "--", file);
  run(cwd, "commit", "--quiet", "-m", `add ${file}`);
}

// 送り先と、main を push 済みの手元のリポジトリを作る。最初の main は、フックを有効にする前に push する（main への push は断られるため）
function setup() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pre-push-test-"));
  const remote = path.join(root, "remote.git");
  const local = path.join(root, "local");
  run(root, "init", "--quiet", "--bare", "-b", "main", remote);
  run(root, "init", "--quiet", "-b", "main", local);
  commit(local, "README.md", "readme\n");
  commit(local, "notes.txt", "notes\n");
  run(local, "remote", "add", "origin", remote);
  run(local, "push", "--quiet", "origin", "main");
  run(local, "config", "core.hooksPath", HOOKS);
  run(local, "switch", "--quiet", "-c", "feature");
  return {
    local,
    push: (...args) => git(local, "push", "--quiet", "origin", ...args).status,
    // 送り先のブランチのコミット。ブランチがなければ空
    remoteSha: (branch) => git(remote, "rev-parse", "--verify", "--quiet", `refs/heads/${branch}`).stdout.trim(),
  };
}

describe("断る", () => {
  test("main への push", () => {
    const { local, push, remoteSha } = setup();
    run(local, "switch", "--quiet", "main");
    const before = remoteSha("main");
    commit(local, "a.txt", "a\n");
    assert.notEqual(push("main"), 0);
    assert.equal(remoteSha("main"), before);
  });

  test("ほかのブランチから main への push（HEAD:main）", () => {
    const { local, push, remoteSha } = setup();
    const before = remoteSha("main");
    commit(local, "a.txt", "a\n");
    assert.notEqual(push("HEAD:main"), 0);
    assert.equal(remoteSha("main"), before);
  });

  for (const [name, args] of [
    ["-f", ["-f", "feature"]],
    ["+ を付けた refspec", ["+feature:feature"]],
  ]) {
    test(`リモートのブランチを書き換える push（${name}）`, () => {
      const { local, push, remoteSha } = setup();
      commit(local, "a.txt", "a\n");
      assert.equal(push("feature"), 0);
      const before = remoteSha("feature");
      run(local, "commit", "--quiet", "--amend", "-m", "amended");
      assert.notEqual(push(...args), 0);
      assert.equal(remoteSha("feature"), before);
    });
  }

  for (const file of [".env", ".env.local", "apps/web/.env"]) {
    test(`.env のファイルを含む push（${file}）`, () => {
      const { local, push, remoteSha } = setup();
      commit(local, file, "KEY=value\n");
      assert.notEqual(push("feature"), 0);
      assert.equal(remoteSha("feature"), "");
    });
  }

  test("トークンの形の文字列を含む push", () => {
    const { local, push, remoteSha } = setup();
    commit(local, "config.txt", `token=${TOKEN}\n`);
    assert.notEqual(push("feature"), 0);
    assert.equal(remoteSha("feature"), "");
  });

  test("リネームしたファイルに足した、トークンの形の文字列を含む push", () => {
    const { local, push, remoteSha } = setup();
    run(local, "mv", "notes.txt", "renamed.txt");
    fs.appendFileSync(path.join(local, "renamed.txt"), `token=${TOKEN}\n`);
    run(local, "add", "--", "renamed.txt");
    run(local, "commit", "--quiet", "-m", "rename");
    assert.notEqual(push("feature"), 0);
    assert.equal(remoteSha("feature"), "");
  });
});

describe("通す", () => {
  test("新しいブランチの push と、そのあとのふつうの push", () => {
    const { local, push, remoteSha } = setup();
    commit(local, "a.txt", "a\n");
    assert.equal(push("-u", "feature"), 0);
    commit(local, "b.txt", "b\n");
    assert.equal(push("feature"), 0);
    assert.equal(remoteSha("feature"), run(local, "rev-parse", "HEAD"));
  });

  test("ブランチを消す push", () => {
    const { local, push, remoteSha } = setup();
    commit(local, "a.txt", "a\n");
    assert.equal(push("feature"), 0);
    assert.equal(push("--delete", "feature"), 0);
    assert.equal(remoteSha("feature"), "");
  });

  test(".env.example を含む push", () => {
    const { local, push, remoteSha } = setup();
    commit(local, ".env.example", "KEY=\n");
    assert.equal(push("feature"), 0);
    assert.equal(remoteSha("feature"), run(local, "rev-parse", "HEAD"));
  });
});
