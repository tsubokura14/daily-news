import type { KeywordConfig, Level } from "../shared/articles.ts";

/** 分類の結果。キーワードに一致しなければ keywords は空、category は "" */
export type Classification = {
  id: string;
  relevance: Level;
  keywords: string[];
  category: string;
};

export type Summary = {
  titleJa: string;
  summary: string;
  importance: Level;
};

/** AI に送る、記事の見出しの情報 */
export type ArticleBrief = { id: string; titleEn: string; domain: string };

/** AI が回数の上限・認証・通信で使えない。その日は AI を使わずに英語の一覧にする */
export class AiUnavailableError extends Error {}

/** AI の返事が読めない。その記事だけを一覧から外す */
export class AiReplyError extends Error {}

/** AI。変えるときは、これを満たすものを足す */
export type Summarizer = {
  /** 記事を、キーワードとの関連度・一致したキーワード・カテゴリで分類する。読めた記事の分だけ返す */
  classify(items: ArticleBrief[], keywords: KeywordConfig): Promise<Classification[]>;
  /** 本文（なければ null）から、日本語のタイトル・要約・重要度を付ける */
  summarize(item: Omit<ArticleBrief, "id"> & { body: string | null }): Promise<Summary>;
};
