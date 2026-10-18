import { describe, expect, it } from "vitest";
import type { KeywordConfig } from "../shared/articles.ts";
import { createGemini, parseClassifications, parseSummary } from "./gemini.ts";
import { AiReplyError, AiUnavailableError } from "./summarizer.ts";

const json = (value: unknown) => JSON.stringify(value);

describe("parseClassifications", () => {
  it("返事から、関連度・一致したキーワード・カテゴリを取り出す", () => {
    const text = json({
      items: [{ id: "hn-1", relevance: 4, keywords: ["Rust"], category: "言語・ツール" }],
    });
    expect(parseClassifications(text, ["hn-1"])).toEqual([
      { id: "hn-1", relevance: 4, keywords: ["Rust"], category: "言語・ツール" },
    ]);
  });

  it("送っていない記事、関連度が1〜5でない記事は外す（ほかの記事は残す）", () => {
    const text = json({
      items: [
        { id: "hn-1", relevance: 4, keywords: [], category: "" },
        { id: "hn-9", relevance: 4, keywords: [], category: "" },
        { id: "hn-2", relevance: 6, keywords: [], category: "" },
        { id: "hn-3", relevance: 2.5, keywords: [], category: "" },
      ],
    });
    expect(parseClassifications(text, ["hn-1", "hn-2", "hn-3"]).map((c) => c.id)).toEqual(["hn-1"]);
  });

  it("JSON でない返事は AiReplyError", () => {
    expect(() => parseClassifications("すみません、できません", ["hn-1"])).toThrow(AiReplyError);
  });
});

describe("parseSummary", () => {
  it("返事から、日本語のタイトル・要約・重要度を取り出す", () => {
    const text = json({ titleJa: "見出し", summary: "要約である。", importance: 3 });
    expect(parseSummary(text)).toEqual({
      titleJa: "見出し",
      summary: "要約である。",
      importance: 3,
    });
  });

  it("形が違う返事は AiReplyError（タイトルが空、重要度が範囲外、JSON でない）", () => {
    expect(() => parseSummary(json({ titleJa: "", summary: "x", importance: 3 }))).toThrow(
      AiReplyError,
    );
    expect(() => parseSummary(json({ titleJa: "a", summary: "x", importance: 0 }))).toThrow(
      AiReplyError,
    );
    expect(() => parseSummary("not json")).toThrow(AiReplyError);
  });
});

describe("createGemini", () => {
  const keywords: KeywordConfig = {
    categories: [{ name: "言語・ツール", keywords: [{ word: "Rust", priority: "medium" }] }],
  };
  const item = { id: "hn-1", titleEn: "Rust 2.0", domain: "example.com" };

  it("AI の呼び出しが失敗したら AiUnavailableError（回数の上限・認証・通信）", async () => {
    const gemini = createGemini({
      model: "m",
      generate: async () => {
        throw new Error("429 quota");
      },
    });
    await expect(gemini.classify([item], keywords)).rejects.toThrow(AiUnavailableError);
    await expect(gemini.summarize({ ...item, body: null })).rejects.toThrow(AiUnavailableError);
  });

  it("返事を読んで、分類・要約を返す", async () => {
    const replies = [
      json({ items: [{ id: "hn-1", relevance: 5, keywords: ["Rust"], category: "言語・ツール" }] }),
      json({ titleJa: "Rust 2.0 が出た", summary: "要約である。", importance: 4 }),
    ];
    const gemini = createGemini({ model: "m", generate: async () => replies.shift() ?? "" });
    expect((await gemini.classify([item], keywords))[0]?.relevance).toBe(5);
    expect((await gemini.summarize({ ...item, body: "本文" })).importance).toBe(4);
  });
});
