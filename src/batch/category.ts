import type { KeywordConfig, Priority } from "../shared/articles.ts";

const RANK: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

/**
 * AI が返した一致したキーワードとカテゴリを、決まりに合わせて直す。
 * 登録にないキーワードは外す。カテゴリは、一致したキーワードのうち優先度がいちばん高いものが入るカテゴリのどれか
 * （複数あれば AI の選んだもの。AI のカテゴリがその中になければ、先に書いたもの）。
 */
export function resolveCategory(
  matched: string[],
  aiCategory: string,
  config: KeywordConfig,
): { keywords: string[]; category: string | null } {
  const entries = matched.flatMap((word) =>
    config.categories.flatMap((c) =>
      c.keywords
        .filter((k) => k.word === word)
        .map((k) => ({ word, category: c.name, rank: RANK[k.priority] })),
    ),
  );
  if (entries.length === 0) return { keywords: [], category: null };
  const top = Math.max(...entries.map((e) => e.rank));
  const categories = entries.filter((e) => e.rank === top).map((e) => e.category);
  const category = categories.includes(aiCategory) ? aiCategory : (categories[0] ?? null);
  return { keywords: [...new Set(entries.map((e) => e.word))], category };
}
