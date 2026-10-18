// 取得のスクリプトと表示ページが共有する、記事と一覧の型。データの持ち方は docs/design.md の「データ」

/** 反響・関連度・重要度の5段階 */
export type Level = 1 | 2 | 3 | 4 | 5;

export type PostType = "show" | "ask";

export type Priority = "high" | "medium" | "low";

export type Article = {
  /** `<ソース>-<ソース内の id>`（例：`hn-12345`） */
  id: string;
  source: "hackernews";
  postType?: PostType;
  titleEn: string;
  /** 元記事。Ask HN は元記事がないので、HN のページ */
  url: string;
  domain: string;
  reaction: Level;
  /** AI を使えなかった日（status が "no-ai"）はない */
  ai?: {
    titleJa: string;
    summary: string;
    importance: Level;
  };
  /** キーワードに関連する記事だけが持つ。キーワード外の記事はない */
  keyword?: {
    relevance: Level;
    keywords: string[];
    category: string;
  };
};

export type DailyList = {
  /** JST の日付（YYYY-MM-DD） */
  date: string;
  /** ok：ふつう。no-ai：AI を使えなかった日。failed：取得に失敗した日 */
  status: "ok" | "no-ai" | "failed";
  /** 表示する順に並べる */
  articles: Article[];
};

export type KeywordConfig = {
  categories: {
    name: string;
    keywords: { word: string; priority: Priority }[];
  }[];
};
