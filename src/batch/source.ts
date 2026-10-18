import type { PostType } from "../shared/articles.ts";

/** ソースから取った記事。一覧の記事（Article）になる前の形で、スコアとコメント数を持つ */
export type SourceItem = {
  /** `<ソース>-<ソース内の id>`（例：`hn-12345`） */
  id: string;
  postType?: PostType;
  titleEn: string;
  url: string;
  domain: string;
  score: number;
  comments: number;
  /** 元記事がない投稿（Ask HN）の、投稿の文章 */
  text?: string;
};

/** 記事を取る元。ソースを足すときは、これを満たすものを足す */
export type Source = {
  /** 注目記事を取る。取れなければ失敗する */
  fetchTop(): Promise<SourceItem[]>;
};
