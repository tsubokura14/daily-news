import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DailyList } from "../shared/articles.ts";
import { run } from "./main.ts";
import type { Source, SourceItem } from "./source.ts";
import { createStore } from "./store.ts";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "daily-news-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const item = (n: number, score: number, comments = 10): SourceItem => ({
  id: `hn-${n}`,
  titleEn: `Title ${n}`,
  url: `https://example.com/${n}`,
  domain: "example.com",
  score,
  comments,
});
const sourceOf = (items: SourceItem[]): Source => ({ fetchTop: async () => items });
const failingSource: Source = {
  fetchTop: async () => {
    throw new Error("通信に失敗");
  },
};
const now = new Date("2026-10-17T22:00:00Z"); // JST では 10/18 7:00
const date = "2026-10-18";
const readJson = async (path: string) => JSON.parse(await readFile(join(dir, path), "utf8"));

describe("run（AI を使わない）", () => {
  it("英語タイトルの一覧（no-ai）・記録・いちばん新しい日を書く。今日の日付は JST", async () => {
    const items = Array.from({ length: 12 }, (_, i) => item(i + 1, 100 + i * 10));
    await run({ source: sourceOf(items), dataDir: dir, now });
    const saved: DailyList = await readJson(`articles/${date}.json`);
    expect(saved.status).toBe("no-ai");
    expect(saved.articles).toHaveLength(12);
    expect(saved.articles[0]).not.toHaveProperty("ai");
    expect(await readJson("latest.json")).toEqual({ date });
    expect(await readJson(`history/${date}.json`)).toHaveLength(12);
  });

  it("記録には最低スコア未満も含めて、取った全件を残す。一覧にはスコアを置かない", async () => {
    await run({ source: sourceOf([item(1, 49), item(2, 500)]), dataDir: dir, now });
    expect(await readJson(`history/${date}.json`)).toHaveLength(2);
    const saved: DailyList = await readJson(`articles/${date}.json`);
    expect(saved.articles.map((a) => a.id)).toEqual(["hn-2"]);
    expect(JSON.stringify(saved)).not.toContain("score");
  });

  it("直近3日の一覧に載せた記事は載せない", async () => {
    const store = createStore(dir);
    await store.writeList({
      date: "2026-10-16",
      status: "no-ai",
      articles: [
        {
          id: "hn-1",
          source: "hackernews",
          titleEn: "x",
          url: "https://example.com",
          domain: "example.com",
          reaction: 3,
        },
      ],
    });
    await run({ source: sourceOf([item(1, 500), item(2, 500)]), dataDir: dir, now });
    const saved: DailyList = await readJson(`articles/${date}.json`);
    expect(saved.articles.map((a) => a.id)).toEqual(["hn-2"]);
  });

  it("反響の順に、件数（30件）まで載せる", async () => {
    const items = Array.from({ length: 40 }, (_, i) => item(i + 1, 50 + i * 20, 5 + i * 5));
    await run({ source: sourceOf(items), dataDir: dir, now });
    const saved: DailyList = await readJson(`articles/${date}.json`);
    expect(saved.articles).toHaveLength(30);
    const reactions = saved.articles.map((a) => a.reaction);
    expect(reactions).toEqual([...reactions].sort((a, b) => b - a));
    // 反響がいちばん大きい記事が先頭
    expect(saved.articles[0]?.id).toBe("hn-40");
  });

  it("同じ日にもう一度動かすと、その日の一覧を置き換える", async () => {
    await run({ source: sourceOf([item(1, 500)]), dataDir: dir, now });
    await run({ source: sourceOf([item(2, 500)]), dataDir: dir, now });
    const saved: DailyList = await readJson(`articles/${date}.json`);
    expect(saved.articles.map((a) => a.id)).toEqual(["hn-2"]);
  });
});

describe("run（取得に失敗したとき）", () => {
  it("その日の一覧がなければ、失敗の印の空の一覧を置き、いちばん新しい日にして、失敗で終わる", async () => {
    await expect(run({ source: failingSource, dataDir: dir, now })).rejects.toThrow();
    expect(await readJson(`articles/${date}.json`)).toEqual({
      date,
      status: "failed",
      articles: [],
    });
    expect(await readJson("latest.json")).toEqual({ date });
  });

  it("前の日の一覧は壊さない", async () => {
    await run({
      source: sourceOf([item(1, 500)]),
      dataDir: dir,
      now: new Date("2026-10-16T22:00:00Z"),
    });
    await expect(run({ source: failingSource, dataDir: dir, now })).rejects.toThrow();
    expect((await readJson("articles/2026-10-17.json")).status).toBe("no-ai");
  });

  it("すでにある、その日の一覧は残す", async () => {
    await run({ source: sourceOf([item(1, 500)]), dataDir: dir, now });
    await expect(run({ source: failingSource, dataDir: dir, now })).rejects.toThrow();
    expect((await readJson(`articles/${date}.json`)).status).toBe("no-ai");
  });

  it("1件も取れなかったときも、失敗として扱う", async () => {
    await expect(run({ source: sourceOf([]), dataDir: dir, now })).rejects.toThrow();
    expect((await readJson(`articles/${date}.json`)).status).toBe("failed");
  });
});
