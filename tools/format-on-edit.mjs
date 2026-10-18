// Edit・Write のあとに、編集したファイルだけに Biome をかける（.claude/settings.json の PostToolUse）。
// 標準入力の JSON から tool_input.file_path を読む。対象でない種類のときも、Biome が失敗したときも、
// 何も言わず終了コード0で終わる（整形の失敗で、編集の作業を止めないため）。
// Biome は npx を通さず、node で起動スクリプトを直接動かす（Windows でも、シェルの違いに左右されない）。
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BIOME_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".json",
  ".jsonc",
  ".css",
]);

export function isBiomeTarget(filePath) {
  if (typeof filePath !== "string") return false;
  return BIOME_EXTENSIONS.has(extname(filePath).toLowerCase());
}

function readStdin() {
  return new Promise((done) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => done(data));
    process.stdin.on("error", () => done(""));
  });
}

async function main() {
  try {
    const filePath = JSON.parse(await readStdin())?.tool_input?.file_path;
    if (!isBiomeTarget(filePath)) return;
    const root = resolve(import.meta.dirname, "..");
    const biome = resolve(root, "node_modules/@biomejs/biome/bin/biome");
    if (!existsSync(biome) || !existsSync(filePath)) return;
    spawnSync(process.execPath, [biome, "check", "--write", filePath], {
      cwd: root,
      stdio: "ignore",
    });
  } catch {
    // 何もしない
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
