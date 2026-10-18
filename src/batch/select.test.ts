import { describe, expect, it } from "vitest";
import type { Article, Level } from "../shared/articles.ts";
import { type Candidate, excludeCandidates, selectArticles, sortArticles } from "./select.ts";

const cand = (
  id: string,
  reaction: Level,
  relevance: Level,
  keywords: string[] = ["LLM"],
): Candidate => ({
  id,
  reaction,
  relevance,
  keywords,
});

const options = { size: 30, relatedRatio: 0.8, minRelevance: 3, minOffKeywordReaction: 4 };

const ids = (list: Candidate[]) => list.map((c) => c.id);

describe("excludeCandidates", () => {
  const items = [
    { id: "a", score: 49 },
    { id: "b", score: 50 },
    { id: "c", score: 300 },
  ];

  it("最低スコア未満を外す（境界は50を含む）", () => {
    expect(
      excludeCandidates(items, { minScore: 50, recentIds: new Set() }).map((i) => i.id),
    ).toEqual(["b", "c"]);
  });

  it("直近の一覧に載せた記事を外す", () => {
    expect(
      excludeCandidates(items, { minScore: 50, recentIds: new Set(["c"]) }).map((i) => i.id),
    ).toEqual(["b"]);
  });
});

describe("selectArticles", () => {
  it("関連する記事を関連度・反響の順に24件、キーワード外を反響の順に6件選ぶ", () => {
    const related = Array.from({ length: 30 }, (_, i) => cand(`r${i}`, 3, i < 2 ? 5 : 3));
    const off = Array.from({ length: 10 }, (_, i) => cand(`o${i}`, i < 3 ? 5 : 4, 1, []));
    const { related: r, offKeyword: o } = selectArticles([...off, ...related], options);
    expect(r).toHaveLength(24);
    expect(ids(r).slice(0, 2)).toEqual(["r0", "r1"]);
    expect(ids(o)).toEqual(["o0", "o1", "o2", "o3", "o4", "o5"]);
  });

  it("関連する記事が足りない日は、キーワード外で埋める", () => {
    const related = Array.from({ length: 10 }, (_, i) => cand(`r${i}`, 3, 4));
    const off = Array.from({ length: 25 }, (_, i) => cand(`o${i}`, 4, 1, []));
    const { related: r, offKeyword: o } = selectArticles([...related, ...off], options);
    expect(r).toHaveLength(10);
    expect(o).toHaveLength(20);
  });

  it("反響が小さいキーワード外の記事では埋めず、30件に届かなくてよい", () => {
    const related = Array.from({ length: 5 }, (_, i) => cand(`r${i}`, 3, 4));
    const off = [cand("o0", 4, 1, []), cand("low", 3, 1, []), cand("low2", 1, 1, [])];
    const { related: r, offKeyword: o } = selectArticles([...related, ...off], options);
    expect(r).toHaveLength(5);
    expect(ids(o)).toEqual(["o0"]);
  });

  it("関連度が3未満、またはキーワードの一致がない記事は、関連する記事にならない", () => {
    const items = [cand("low-rel", 5, 2), cand("no-kw", 5, 5, [])];
    const { related, offKeyword } = selectArticles(items, options);
    expect(related).toEqual([]);
    // 反響が4以上なので、キーワード外の候補にはなる
    expect(ids(offKeyword).sort()).toEqual(["low-rel", "no-kw"]);
  });
});

describe("sortArticles", () => {
  const article = (
    id: string,
    reaction: Level,
    rel?: { relevance: Level; importance: Level },
  ): Article => ({
    id,
    source: "hackernews",
    titleEn: id,
    url: "https://example.com",
    domain: "example.com",
    reaction,
    ai: { titleJa: id, summary: "", importance: rel?.importance ?? 3 },
    keyword: rel && { relevance: rel.relevance, keywords: ["LLM"], category: "AI" },
  });

  it("関連する記事は関連度・重要度・反響の順、そのあとにキーワード外を反響の順に並べる", () => {
    const sorted = sortArticles([
      article("off-low", 4),
      article("r-3", 5, { relevance: 3, importance: 5 }),
      article("off-high", 5),
      article("r-5-imp3", 1, { relevance: 5, importance: 3 }),
      article("r-5-imp4-re2", 2, { relevance: 5, importance: 4 }),
      article("r-5-imp4-re5", 5, { relevance: 5, importance: 4 }),
    ]);
    expect(sorted.map((a) => a.id)).toEqual([
      "r-5-imp4-re5",
      "r-5-imp4-re2",
      "r-5-imp3",
      "r-3",
      "off-high",
      "off-low",
    ]);
  });
});
