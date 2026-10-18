import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DailyList } from "../shared/articles.ts";
import { run } from "./main.ts";
import type { Source, SourceItem } from "./source.ts";
import { createStore } from "./store.ts";
import { AiReplyError, AiUnavailableError, type Summarizer } from "./summarizer.ts";

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
    // 反響の大きい記事が先に来る（同じ反響なら取得した順）
    expect(reactions[0]).toBeGreaterThan(reactions[29] ?? 5);
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

describe("run（AI を使う）", () => {
  // hn-1 は低いスコアの記事、hn-100 は反響がとても大きい記事
  const items = [
    ...Array.from({ length: 10 }, (_, i) => item(i + 1, 50, 1)),
    item(100, 5000, 2000),
  ];
  const fakeAi = (over: Partial<Summarizer> = {}): Summarizer => ({
    classify: async (list) =>
      list.map((i) =>
        i.id === "hn-1"
          ? { id: i.id, relevance: 5, keywords: ["Rust"], category: "言語・ツール" }
          : { id: i.id, relevance: 1, keywords: [], category: "" },
      ),
    summarize: async ({ titleEn }) => ({
      titleJa: `日本語 ${titleEn}`,
      summary: "要約である。",
      importance: 3,
    }),
    ...over,
  });
  const runWith = (
    summarizer: Summarizer,
    extra: Partial<Parameters<typeof run>[0]> = {},
    list = items,
  ) =>
    run({
      source: sourceOf(list),
      dataDir: dir,
      now,
      summarizer,
      fetchBody: async () => "本文",
      sleep: async () => {},
      ...extra,
    });
  const saved = (): Promise<DailyList> => readJson(`articles/${date}.json`);

  it("日本語の一覧（ok）を書く。キーワードに関連する記事が先、キーワード外が後", async () => {
    await runWith(fakeAi());
    const list = await saved();
    expect(list.status).toBe("ok");
    expect(list.articles.map((a) => a.id)).toEqual(["hn-1", "hn-100"]);
    expect(list.articles[0]?.keyword).toEqual({
      relevance: 5,
      keywords: ["Rust"],
      category: "言語・ツール",
    });
    expect(list.articles[0]?.ai?.titleJa).toBe("日本語 Title 1");
    expect(list.articles[1]).not.toHaveProperty("keyword");
  });

  it("候補を分類の件数（50件）ずつに分けて送り、呼び出しの間を空ける", async () => {
    const sizes: number[] = [];
    let pauses = 0;
    const many = Array.from({ length: 120 }, (_, i) => item(i + 1, 100));
    await runWith(
      fakeAi({
        classify: async (list) => {
          sizes.push(list.length);
          return [];
        },
      }),
      {
        sleep: async () => {
          pauses += 1;
        },
      },
      many,
    );
    expect(sizes).toEqual([50, 50, 20]);
    expect(pauses).toBeGreaterThanOrEqual(2);
  });

  it("要約の返事が読めない記事だけを外す", async () => {
    await runWith(
      fakeAi({
        summarize: async ({ titleEn }) => {
          if (titleEn === "Title 100") throw new AiReplyError("読めない");
          return { titleJa: "日本語", summary: "要約である。", importance: 3 };
        },
      }),
    );
    const list = await saved();
    expect(list.status).toBe("ok");
    expect(list.articles.map((a) => a.id)).toEqual(["hn-1"]);
  });

  it("本文を読めなかった記事は、要約の最後に決まった一文を付ける", async () => {
    await runWith(fakeAi(), { fetchBody: async () => null });
    const list = await saved();
    expect(list.articles[0]?.ai?.summary).toBe(
      "要約である。（本文を読めなかったため、タイトルからの推測を含む）",
    );
  });

  it("本文を読めた記事は、本文を AI に送る。元記事がない投稿は、投稿の文章を送る", async () => {
    const bodies: Record<string, string | null> = {};
    const ask = { ...item(1, 50, 1), url: "https://news.ycombinator.com/item?id=1", text: "投稿" };
    const fetched: string[] = [];
    await runWith(
      fakeAi({
        summarize: async ({ titleEn, body }) => {
          bodies[titleEn] = body;
          return { titleJa: "日本語", summary: "要約である。", importance: 3 };
        },
      }),
      {
        fetchBody: async (url) => {
          fetched.push(url);
          return "本文";
        },
      },
      [ask, ...items.slice(1)],
    );
    expect(bodies["Title 1"]).toBe("投稿");
    expect(bodies["Title 100"]).toBe("本文");
    expect(fetched).not.toContain(ask.url);
  });

  it("分類で AI が使えなかったら、英語の一覧（no-ai）にする", async () => {
    await runWith(
      fakeAi({
        classify: async () => {
          throw new AiUnavailableError("上限");
        },
      }),
    );
    const list = await saved();
    expect(list.status).toBe("no-ai");
    expect(list.articles).toHaveLength(11);
    expect(list.articles[0]).not.toHaveProperty("ai");
    expect(list.articles[0]).not.toHaveProperty("keyword");
  });

  it("要約の途中で AI が使えなくなっても、英語の一覧（no-ai）にする", async () => {
    await runWith(
      fakeAi({
        summarize: async () => {
          throw new AiUnavailableError("上限");
        },
      }),
    );
    const list = await saved();
    expect(list.status).toBe("no-ai");
    expect(list.articles.every((a) => !a.ai)).toBe(true);
  });
});
