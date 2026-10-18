import { readFileSync } from "node:fs";
import type { KeywordConfig, Priority } from "../shared/articles.ts";

const MAX_CATEGORIES = 10;
const MAX_NAME_LENGTH = 6;
const PRIORITIES: readonly string[] = ["high", "medium", "low"] satisfies Priority[];

/** キーワードのファイルの中身の形を確かめる。壊れていたら、直す場所が分かるメッセージで失敗する */
export function parseKeywords(raw: unknown): KeywordConfig {
  const categories = (raw as { categories?: unknown } | null)?.categories;
  if (!Array.isArray(categories)) throw new Error("keywords.json：categories が配列ではありません");
  if (categories.length > MAX_CATEGORIES) {
    throw new Error(`keywords.json：カテゴリは${MAX_CATEGORIES}個までです`);
  }
  for (const category of categories) {
    const { name, keywords } = (category ?? {}) as { name?: unknown; keywords?: unknown };
    if (typeof name !== "string" || name === "" || [...name].length > MAX_NAME_LENGTH) {
      throw new Error(
        `keywords.json：カテゴリの名前は1〜${MAX_NAME_LENGTH}文字にしてください（${String(name)}）`,
      );
    }
    if (!Array.isArray(keywords))
      throw new Error(`keywords.json：「${name}」の keywords が配列ではありません`);
    for (const keyword of keywords) {
      const { word, priority } = (keyword ?? {}) as { word?: unknown; priority?: unknown };
      if (typeof word !== "string" || word === "") {
        throw new Error(`keywords.json：「${name}」に空のキーワードがあります`);
      }
      if (typeof priority !== "string" || !PRIORITIES.includes(priority)) {
        throw new Error(
          `keywords.json：「${word}」の priority は high・medium・low のどれかにしてください`,
        );
      }
    }
  }
  return raw as KeywordConfig;
}

export function loadKeywords(): KeywordConfig {
  const text = readFileSync(new URL("./keywords.json", import.meta.url), "utf8");
  return parseKeywords(JSON.parse(text));
}
