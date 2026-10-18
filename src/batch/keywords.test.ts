import { describe, expect, it } from "vitest";
import { loadKeywords, parseKeywords } from "./keywords.ts";

const category = (name: string, word = "LLM", priority = "high") => ({
  name,
  keywords: [{ word, priority }],
});

describe("parseKeywords", () => {
  it("正しい形ならそのまま返す", () => {
    const raw = { categories: [category("AI")] };
    expect(parseKeywords(raw)).toEqual(raw);
  });

  it("カテゴリは10個まで（11個は失敗）", () => {
    const make = (n: number) => ({
      categories: Array.from({ length: n }, (_, i) => category(`c${i}`)),
    });
    expect(() => parseKeywords(make(10))).not.toThrow();
    expect(() => parseKeywords(make(11))).toThrow();
  });

  it("カテゴリの名前は6文字まで（7文字は失敗）", () => {
    expect(() => parseKeywords({ categories: [category("あいうえおか")] })).not.toThrow();
    expect(() => parseKeywords({ categories: [category("あいうえおかき")] })).toThrow();
  });

  it("優先度が high・medium・low 以外なら失敗", () => {
    expect(() => parseKeywords({ categories: [category("AI", "LLM", "urgent")] })).toThrow();
  });

  it("キーワードが空の文字列なら失敗", () => {
    expect(() => parseKeywords({ categories: [category("AI", "")] })).toThrow();
  });

  it("形が違うなら失敗", () => {
    expect(() => parseKeywords({})).toThrow();
    expect(() => parseKeywords(null)).toThrow();
  });
});

describe("loadKeywords", () => {
  it("リポジトリの keywords.json が正しい形である", () => {
    expect(loadKeywords().categories.length).toBeGreaterThan(0);
  });
});
