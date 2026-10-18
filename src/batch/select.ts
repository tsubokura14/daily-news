import type { Article, Level } from "../shared/articles.ts";

/** 分類のあとの、一覧に載せるかどうかを決める前の記事 */
export type Candidate = {
  id: string;
  reaction: Level;
  relevance: Level;
  /** 一致したキーワード */
  keywords: string[];
};

/** 最低スコア未満と、直近の一覧に載せた記事を外す */
export function excludeCandidates<T extends { id: string; score: number }>(
  items: T[],
  options: { minScore: number; recentIds: Set<string> },
): T[] {
  return items.filter((i) => i.score >= options.minScore && !options.recentIds.has(i.id));
}

/**
 * 一覧に載せる記事を選ぶ。
 * キーワードに関連する記事（関連度が minRelevance 以上でキーワードが一致）を、関連度・反響の順に size × relatedRatio 件まで。
 * 残りは、反響が minOffKeywordReaction 以上のキーワード外の記事を反響の順に取る。
 * 関連する記事が足りない日は、そのぶんもキーワード外で埋める。反響の小さい記事では埋めないので、size に届かないことがある。
 *
 * 関連度が低いが反響が大きい記事は、キーワードに一致していても、キーワード外の候補になる。
 */
export function selectArticles(
  candidates: Candidate[],
  options: {
    size: number;
    relatedRatio: number;
    minRelevance: number;
    minOffKeywordReaction: number;
  },
): { related: Candidate[]; offKeyword: Candidate[] } {
  const isRelated = (c: Candidate) => c.relevance >= options.minRelevance && c.keywords.length > 0;
  // 並べ替えは安定なので、同じ値なら渡された順のまま
  const related = candidates
    .filter(isRelated)
    .sort((a, b) => b.relevance - a.relevance || b.reaction - a.reaction)
    .slice(0, Math.round(options.size * options.relatedRatio));
  const offKeyword = candidates
    .filter((c) => !isRelated(c) && c.reaction >= options.minOffKeywordReaction)
    .sort((a, b) => b.reaction - a.reaction)
    .slice(0, options.size - related.length);
  return { related, offKeyword };
}

/**
 * 表示する順に並べる。キーワードに関連する記事を関連度・重要度・反響の順、そのあとにキーワード外を反響の順。
 */
export function sortArticles(articles: Article[]): Article[] {
  const related = articles
    .filter((a) => a.keyword)
    .sort(
      (a, b) =>
        (b.keyword?.relevance ?? 0) - (a.keyword?.relevance ?? 0) ||
        (b.ai?.importance ?? 0) - (a.ai?.importance ?? 0) ||
        b.reaction - a.reaction,
    );
  const off = articles.filter((a) => !a.keyword).sort((a, b) => b.reaction - a.reaction);
  return [...related, ...off];
}
