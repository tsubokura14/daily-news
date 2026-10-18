import { describe, expect, it } from "vitest";
import type { KeywordConfig } from "../shared/articles.ts";
import { resolveCategory } from "./category.ts";

const keywords: KeywordConfig = {
  categories: [
    { name: "AI", keywords: [{ word: "LLM", priority: "high" }] },
    {
      name: "インフラ",
      keywords: [
        { word: "Linux", priority: "medium" },
        { word: "Docker", priority: "medium" },
      ],
    },
    { name: "セキュリティ", keywords: [{ word: "脆弱性", priority: "medium" }] },
  ],
};

describe("resolveCategory", () => {
  it("一致したキーワードのカテゴリを返す", () => {
    expect(resolveCategory(["Linux"], "インフラ", keywords)).toEqual({
      keywords: ["Linux"],
      category: "インフラ",
    });
  });

  it("AI のカテゴリが、優先度がいちばん高いキーワードのカテゴリでなければ、そちらに直す", () => {
    expect(resolveCategory(["Linux", "LLM"], "インフラ", keywords).category).toBe("AI");
  });

  it("いちばん高い優先度のキーワードが複数のカテゴリにあれば、AI が選んだカテゴリを使う", () => {
    expect(resolveCategory(["Linux", "脆弱性"], "セキュリティ", keywords).category).toBe(
      "セキュリティ",
    );
  });

  it("同じ優先度でも、AI のカテゴリがその中になければ、先に書いたカテゴリにする", () => {
    expect(resolveCategory(["Linux", "脆弱性"], "AI", keywords).category).toBe("インフラ");
  });

  it("登録にないキーワードは外し、1つも残らなければカテゴリなし", () => {
    expect(resolveCategory(["Linux", "Rust"], "インフラ", keywords).keywords).toEqual(["Linux"]);
    expect(resolveCategory(["Rust"], "AI", keywords)).toEqual({ keywords: [], category: null });
  });
});
