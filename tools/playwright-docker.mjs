// 画面を撮るテストを、Playwright 公式の Docker イメージの中で動かす。
//   node tools/playwright-docker.mjs          撮って、docs/specs/screens/ の基準と比べる
//   node tools/playwright-docker.mjs update   基準を撮り直す
// 環境変数 PORT で、立ち上げるサーバーのポートを変えられる。
//
// Docker の中で撮る理由：OS が違うと文字の描き方が変わり、画像が一致しないため。
// 手元（Windows）と CI（e2e ジョブ）で、同じイメージを使う。
// イメージの版は、入れた Playwright（package.json）と同じにする。ci.yml の版も同じにする。
//
// node_modules は、Windows のもの（Biome、esbuild などは OS ごとのバイナリ）を使わず、
// 名前付きのボリュームに Linux 用を入れる。npm ci は、ボリュームが空のときと、
// package-lock.json が変わったときだけ動かす。
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const IMAGE = "mcr.microsoft.com/playwright:v1.64.1-noble";
const VOLUME = "daily-news-node-modules";

const mode = process.argv[2] ?? "test";
if (mode !== "test" && mode !== "update") {
  console.error(`使い方：node tools/playwright-docker.mjs [test|update]（受け取った値：${mode}）`);
  process.exit(2);
}

const playwright = [
  "npx playwright test --project=screens",
  // 比べるだけのときは、基準がなくても書かずに失敗させる
  mode === "update" ? "--update-snapshots=all" : "--update-snapshots=none",
]
  .filter(Boolean)
  .join(" ");

const script = [
  "set -e",
  "if ! cmp -s package-lock.json node_modules/.package-lock.copy; then",
  "  npm ci",
  "  cp package-lock.json node_modules/.package-lock.copy",
  "fi",
  playwright,
].join("\n");

const root = resolve(import.meta.dirname, "..");
const args = [
  "run",
  "--rm",
  "--ipc=host",
  "--init",
  "-v",
  `${root}:/work`,
  "-v",
  `${VOLUME}:/work/node_modules`,
  "-w",
  "/work",
  "-e",
  `PORT=${process.env.PORT ?? 5173}`,
  "-e",
  "CI=",
  IMAGE,
  "bash",
  "-c",
  script,
];

const result = spawnSync("docker", args, { stdio: "inherit" });
if (result.error) {
  console.error(`docker を動かせませんでした。Docker Desktop を起動してください：${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
