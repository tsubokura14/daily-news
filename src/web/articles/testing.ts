import type { Article } from "../../shared/articles.ts";

/** テスト用の記事。ふつうの（キーワードに関連する）記事で、上書きで変える */
export function makeArticle(id: string, overrides: Partial<Article> = {}): Article {
  return {
    id: `hn-${id}`,
    source: "hackernews",
    titleEn: `English title ${id}`,
    url: `https://example.com/${id}`,
    domain: "example.com",
    reaction: 3,
    ai: { titleJa: `日本語の見出し ${id}`, summary: `要約 ${id}`, importance: 3 },
    keyword: { relevance: 4, keywords: ["LLM"], category: "AI" },
    ...overrides,
  };
}

/** キーワード外の記事（keyword を持たない） */
export function makeOutside(id: string, overrides: Partial<Article> = {}): Article {
  const { keyword: _, ...rest } = makeArticle(id);
  return { ...rest, ...overrides };
}
