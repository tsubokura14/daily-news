import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Article, DailyList } from "../shared/articles.ts";
import { addDays, createStore } from "./store.ts";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "daily-news-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const article = (id: string): Article => ({
  id,
  source: "hackernews",
  titleEn: id,
  url: "https://example.com",
  domain: "example.com",
  reaction: 3,
});
const list = (date: string, ids: string[], status: DailyList["status"] = "no-ai"): DailyList => ({
  date,
  status,
  articles: ids.map(article),
});

describe("addDays", () => {
  it("日付を日数ぶんずらす（月をまたぐ）", () => {
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30");
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  });
});

describe("recentArticleIds", () => {
  it("直近3日の一覧に載せた記事の ID を返す（3日前は含み、4日前は含まない）", async () => {
    const store = createStore(dir);
    await store.writeList(list("2026-10-14", ["hn-3days"]));
    await store.writeList(list("2026-10-13", ["hn-4days"]));
    await store.writeList(list("2026-10-17", ["hn-1day"]));
    expect(await store.recentArticleIds("2026-10-17", 3)).toEqual(new Set(["hn-3days", "hn-1day"]));
  });

  it("一覧がない日があっても読める", async () => {
    expect(await createStore(dir).recentArticleIds("2026-10-17", 3)).toEqual(new Set());
  });
});

describe("readHistory", () => {
  it("直近30日の記録を返す。同じ記事は新しい日の値を使う", async () => {
    const store = createStore(dir);
    await store.writeHistory("2026-09-17", [{ id: "hn-old", score: 1, comments: 1 }]);
    await store.writeHistory("2026-09-18", [
      { id: "hn-a", score: 10, comments: 1 },
      { id: "hn-edge", score: 5, comments: 5 },
    ]);
    await store.writeHistory("2026-10-17", [{ id: "hn-a", score: 99, comments: 9 }]);
    const records = await store.readHistory("2026-10-17", 30);
    expect(records).toHaveLength(2);
    expect(records).toContainEqual({ id: "hn-a", score: 99, comments: 9 });
    expect(records).toContainEqual({ id: "hn-edge", score: 5, comments: 5 });
  });

  it("記録がないときは空", async () => {
    expect(await createStore(dir).readHistory("2026-10-17", 30)).toEqual([]);
  });
});

describe("writeList / writeLatest", () => {
  it("同じ日にもう一度書くと置き換わる", async () => {
    const store = createStore(dir);
    await store.writeList(list("2026-10-17", ["hn-1", "hn-2"]));
    await store.writeList(list("2026-10-17", ["hn-3"]));
    const saved = JSON.parse(await readFile(join(dir, "articles/2026-10-17.json"), "utf8"));
    expect(saved.articles.map((a: Article) => a.id)).toEqual(["hn-3"]);
  });

  it("いちばん新しい日を書く", async () => {
    await createStore(dir).writeLatest("2026-10-17");
    expect(JSON.parse(await readFile(join(dir, "latest.json"), "utf8"))).toEqual({
      date: "2026-10-17",
    });
  });
});

describe("writeFailedIfAbsent", () => {
  it("その日の一覧がなければ、取得に失敗した印の空の一覧を置く", async () => {
    const store = createStore(dir);
    await store.writeFailedIfAbsent("2026-10-17");
    expect(await store.readList("2026-10-17")).toEqual({
      date: "2026-10-17",
      status: "failed",
      articles: [],
    });
  });

  it("その日の一覧がすでにあれば、そのまま残す", async () => {
    const store = createStore(dir);
    await store.writeList(list("2026-10-17", ["hn-1"]));
    await store.writeFailedIfAbsent("2026-10-17");
    expect((await store.readList("2026-10-17"))?.status).toBe("no-ai");
  });
});
