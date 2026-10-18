import { describe, expect, it } from "vitest";
import { applyFilter, type Filter, filterCells, sameFilter } from "./filter.ts";
import { makeArticle, makeOutside } from "./testing.ts";

const names = ["AI", "Web開発", "セキュリティ"];
const articles = [
  makeArticle("1", { keyword: { relevance: 5, keywords: ["LLM"], category: "AI" } }),
  makeArticle("2", { keyword: { relevance: 4, keywords: ["Claude"], category: "AI" } }),
  makeArticle("3", { keyword: { relevance: 4, keywords: ["脆弱性"], category: "セキュリティ" } }),
  makeOutside("4"),
];

describe("filterCells", () => {
  it("すべて・カテゴリ（登録の順）・キーワード外の順に、件数つきで並べる。0件のカテゴリも残す", () => {
    expect(filterCells(articles, names).map((c) => [c.label, c.count])).toEqual([
      ["すべて", 4],
      ["AI", 2],
      ["Web開発", 0],
      ["セキュリティ", 1],
      ["キーワード外", 1],
    ]);
  });
});

describe("applyFilter", () => {
  const ids = (filter: Filter) => applyFilter(articles, filter).map((a) => a.id);

  it("すべては全部、カテゴリはそのカテゴリだけ、キーワード外は keyword のない記事だけ", () => {
    expect(ids({ kind: "all" })).toEqual(["hn-1", "hn-2", "hn-3", "hn-4"]);
    expect(ids({ kind: "category", name: "AI" })).toEqual(["hn-1", "hn-2"]);
    expect(ids({ kind: "outside" })).toEqual(["hn-4"]);
  });

  it("一致する記事のないカテゴリは空", () => {
    expect(ids({ kind: "category", name: "Web開発" })).toEqual([]);
  });
});

describe("sameFilter", () => {
  it("種類と、カテゴリなら名前まで同じときだけ同じ", () => {
    expect(sameFilter({ kind: "all" }, { kind: "all" })).toBe(true);
    expect(sameFilter({ kind: "category", name: "AI" }, { kind: "category", name: "AI" })).toBe(
      true,
    );
    expect(
      sameFilter({ kind: "category", name: "AI" }, { kind: "category", name: "Web開発" }),
    ).toBe(false);
    expect(sameFilter({ kind: "all" }, { kind: "outside" })).toBe(false);
  });
});
