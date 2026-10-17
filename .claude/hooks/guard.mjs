// 確実に止めたいコマンドだけを止める（.claude/settings.json の hooks と、サブエージェントの frontmatter から呼ぶ）
// - Git のフック（.githooks/。main への push と秘密情報を止める）を外す・飛ばすコマンド
// - コマンドで .env を読む（Read は settings.json の deny で止まっているが、deny はコマンドには効かない）
// - pr-check・test-runner の書き込み
// ふつうの作業を止めないよう、文章の中の言葉（PR の本文、コミットメッセージ、heredoc）では止めない。ただし、シェルやインタプリタに渡す heredoc の中身はコマンドとして見る
// 止めるときは exit 2 で終える。0 と 2 以外で終わると Claude Code は止めずに通すので、確かめる途中で失敗したら止める側に倒す
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function block(message) {
  process.stderr.write(message + "\n");
  process.exit(2);
}

// heredoc・here-string を渡すと、中身をコマンドとして実行するもの
const INTERPRETERS = new Set(["bash", "sh", "zsh", "dash", "ksh", "pwsh", "powershell", "iex", "invoke-expression", "node", "python", "python3", "py", "ruby", "perl", "eval"]);

function feedsInterpreter(line) {
  return line.split(/;|&&|\|\||\||\$\(|\(|`/).some((s) => INTERPRETERS.has((words(s.trim())[0] || "").toLowerCase().replace(/\.exe$/, "")));
}

// heredoc（<<'EOF' ... EOF）と PowerShell の here-string（@' ... '@）の中身は文章なので、見る前に外す
// 同じ行でシェルやインタプリタに渡しているとき（bash <<EOF、... | iex など）は、中身もコマンドとして残す
function stripDocuments(command) {
  const keepIfRun = (before, after, body) => (feedsInterpreter(before + after) ? `${before}${after}\n${body}` : `${before}${after}`);
  return command
    .replace(/([^\n]*)<<-?\s*(['"]?)(\w+)\2([^\n]*)\n([\s\S]*?)\n\s*\3\s*(?=\n|$)/g, (_, before, _quote, _tag, after, body) => keepIfRun(before, after, body))
    .replace(/([^\n]*)@(['"])\r?\n([\s\S]*?)\r?\n\2@([^\n]*)/g, (_, before, _quote, body, after) => keepIfRun(before, after, body));
}

// $( に対応する ) の位置（見つからなければ -1）
function closingParen(text, start) {
  let depth = 1;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "(") depth++;
    if (text[i] === ")" && --depth === 0) return i;
  }
  return -1;
}

// ; & | 改行 ( ) で区切った、1つずつのコマンド。引用符の中（コミットメッセージなど）では区切らない
// $(...) と `...` は、"..." の中でも別のコマンドとして実行されるので、中身を取り出して1つずつ見る
// escapes：\ を次の1文字のエスケープとして読むか（bash は読む。PowerShell では \ はただの文字）
function splitCommands(text, escapes) {
  const out = [];
  let cur = "";
  let quote = null;
  const flush = () => {
    if (cur.trim()) out.push(cur.trim());
    cur = "";
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote === "'") {
      cur += c;
      if (c === "'") quote = null;
    } else if (escapes && c === "\\" && i + 1 < text.length) {
      cur += c + text[++i];
    } else if ((c === "$" && text[i + 1] === "(") || c === "`") {
      const close = c === "`" ? text.indexOf("`", i + 1) : closingParen(text, i + 2);
      const end = close === -1 ? text.length : close;
      out.push(...splitCommands(text.slice(i + (c === "`" ? 1 : 2), end), escapes));
      cur += "_";
      i = end;
    } else if (quote === '"') {
      cur += c;
      if (c === '"') quote = null;
    } else if (c === "'" || c === '"') {
      quote = c;
      cur += c;
    } else if (";&|\n()".includes(c)) {
      flush();
    } else {
      cur += c;
    }
  }
  flush();
  return out;
}

// どちらのシェルのコマンドかは見分けられないので、両方の読み方で区切り、どちらかで当たれば止める
function segments(command) {
  const text = stripDocuments(command);
  return [...new Set([...splitCommands(text, true), ...splitCommands(text, false)])];
}

// 引用符を外した語の並び（"a b" は1語）
function words(segment) {
  return [...segment.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
}

// 実行するコマンドの名前と、その後ろの語。/usr/bin/git や git.exe も git と読み、前に付く env・command・&・環境変数の設定（FOO=1）は読み飛ばす
function commandWords(w) {
  let i = 0;
  while (i < w.length && (["&", "env", "command"].includes(w[i].toLowerCase()) || /^\w+=/.test(w[i]) || (i > 0 && w[i].startsWith("-")))) i++;
  const name = (w[i] || "").split(/[\\/]/).pop().toLowerCase().replace(/\.exe$/, "");
  return [name, ...w.slice(i + 1)];
}

// ファイルの中身を会話に出すコマンド
const READERS = new Set(["cat", "type", "less", "more", "head", "tail", "bat", "nl", "od", "xxd", "strings", "base64", "sed", "awk", "grep", "rg", "findstr", "source", ".", "cp", "mv", "copy", "copy-item", "cpi", "get-content", "gc", "select-string", "sls"]);

// .env か .env.<名前>。.env.example などの見本は通す
function isEnvName(name) {
  return /^\.env(\.[\w-]+)*$/.test(name) && !/\.(example|sample|template)$/i.test(name);
}

// ワイルドカード（* ? [...]）を、ファイル名に当てる正規表現にする
function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    const end = c === "[" ? glob.indexOf("]", i + 2) : -1;
    if (c === "*") re += ".*";
    else if (c === "?") re += ".";
    else if (end !== -1) {
      re += `[${glob.slice(i + 1, end).replace(/^!/, "^").replace(/\\/g, "\\\\")}]`;
      i = end;
    } else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`, "i");
}

// ワイルドカードが当たりうる .env の名前：よくある名前と、そのフォルダに今ある .env のファイル
function envNames(dir) {
  const names = [".env", ".env.local", ".env.development", ".env.production", ".env.test"];
  try {
    names.push(...fs.readdirSync(path.resolve(input.cwd || process.cwd(), dir)).filter(isEnvName));
  } catch {
    // フォルダを読めなければ、よくある名前だけで見る
  }
  return names;
}

function isEnvFile(word) {
  // パスの最後の部分（git show HEAD:.env の : の後ろも）を見る
  const name = word.split(/[\\/:]/).pop();
  if (!/[*?[]/.test(name)) return isEnvName(name);
  // ワイルドカードは、.env に当たりうるなら止める（cat .env*、cat .en?）。.env.exam* のように見本だけに当たるものは通す
  // bash の * ? は先頭の . に当たらないので、. で始まらない語（cat *.md など）は見ない
  const dir = word.slice(0, word.length - name.length).replace(/^.*:/, "");
  return name.startsWith(".") && envNames(/[*?[]/.test(dir) ? "" : dir).some((n) => globToRegExp(name).test(n));
}

function readsEnv(segment) {
  // < .env の入力のリダイレクト（$(<.env)、sort<".env" など）は、どのコマンドでも中身を読む
  // 引用符の中の < は文字なので見ない（同じ長さの空白に置き換えて、位置を保つ）。<< と <( はリダイレクトではない
  const masked = segment.replace(/"[^"]*"|'[^']*'/g, (m) => " ".repeat(m.length));
  for (const m of masked.matchAll(/(?<!<)<(?![<(])/g)) {
    if (isEnvFile(words(segment.slice(m.index + 1))[0] || "")) return true;
  }
  const w = commandWords(words(segment));
  const cmd = w[0];
  const isReader = READERS.has(cmd) || (cmd === "git" && ["show", "cat-file"].includes(w[1]));
  return isReader && w.slice(1).some(isEnvFile);
}

function checkCommand(command) {
  for (const segment of segments(command)) {
    const w = commandWords(words(segment));
    // 環境変数（GIT_CONFIG_KEY_0=core.hooksPath、$env:GIT_CONFIG_PARAMETERS など）でも外せるので、先頭が git でなくても見る
    // 見るのは先頭に並ぶ環境変数の設定だけ。-m "..." の中の同じ文字では止まらない
    const envs = segment.match(/^(?:(?:env|export)\s+)?(?:(?:\$env:)?\w+\s*=\s*(?:"[^"]*"|'[^']*'|\S+)\s*)+/i)?.[0] || "";
    if (/GIT_CONFIG_(KEY_\d+|PARAMETERS)\b/i.test(envs) && /core\.hookspath/i.test(envs)) {
      block("Git のフック（main への push と秘密情報を止めるもの）を外す・飛ばすコマンドは使わない。");
    }
    if (w[0] === "git") {
      // git -c core.hooksPath=... push、git --config-env=core.hooksPath=<環境変数> push、git config core.hooksPath ...、git push --no-verify。語ごとに見るので、-m "..." の中の文字では止まらない
      if (w.some((x) => /^(-c|--config-env=)?core\.hookspath/i.test(x)) || w.includes("--no-verify")) {
        block("Git のフック（main への push と秘密情報を止めるもの）を外す・飛ばすコマンドは使わない。");
      }
    }
    if (readsEnv(segment)) {
      block(".env は、コマンドでも読まない（秘密情報が会話に入るため）。中身が要るなら、止まって人間に伝える。");
    }
  }
}

// pr-check（.claude/agents/pr-check.md）は、差分とログを見るだけにする（--output はファイルに書き出すので止める）
function checkPrCheckCommand(command) {
  const c = command.trim();
  if (!/^git (diff|log|show|status)\b/.test(c) || /[;&|<>`\r\n]|\$\(|\s--output\b/.test(c)) {
    block("pr-check で使えるコマンドは、1つの git diff / git log / git show / git status だけ。");
  }
}

// test-runner（.claude/agents/test-runner.md）は、テストを実行して結果を返すだけにする
// テストのコマンドは技術で変わるので、通すものではなく、止めるもの（基準の画像の更新、git の書き込み、ファイルを変える操作）を決める
function checkTestRunnerCommand(command) {
  if (/update-?snapshots?|--update\b|(^|\s)-u(\s|$)/i.test(command)) {
    block("test-runner は基準の画像を更新しない。撮り直すかどうかは、呼んだ側が決める。");
  }
  if (/\bgit\s+(add|commit|push|switch|checkout|restore|reset|clean|stash|merge|rebase|rm|mv|tag|branch)\b/.test(command)) {
    block("test-runner は git で書き込まない。");
  }
  if (/(^|[;&|]\s*)(rm|mv|cp|del|rmdir)\s|(^|[^0-9&>])>{1,2}\s*[^&\s]/.test(command)) {
    block("test-runner はファイルを消す・動かす・書き出す操作をしない。");
  }
}

let input;
try {
  input = JSON.parse(fs.readFileSync(0, "utf8"));
  const command = String(input.tool_input?.command || "");
  if (process.argv[2] === "pr-check") {
    checkPrCheckCommand(command);
  } else if (process.argv[2] === "test-runner") {
    checkTestRunnerCommand(command);
  } else if (input.hook_event_name === "SessionStart") {
    // clone し直すと core.hooksPath は消えるので、会話を始めるたびに設定し直す
    execFileSync("git", ["-C", process.env.CLAUDE_PROJECT_DIR || input.cwd, "config", "core.hooksPath", ".githooks"]);
  } else if (["Bash", "PowerShell"].includes(input.tool_name)) {
    checkCommand(command);
  }
} catch (error) {
  // コマンドの確かめで失敗したら止める。会話の始めの設定で失敗しても、作業は止めない
  if (input?.tool_name || ["pr-check", "test-runner"].includes(process.argv[2])) block(`.claude/hooks/guard.mjs が失敗したので止めた：${error.message}`);
  process.stderr.write(`.claude/hooks/guard.mjs: ${error.message}\n`);
}
process.exit(0);
