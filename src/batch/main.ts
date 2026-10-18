import { fileURLToPath } from "node:url";
import type { Article, DailyList } from "../shared/articles.ts";
import { config } from "./config.ts";
import { createHackerNews } from "./hackernews.ts";
import { loadKeywords } from "./keywords.ts";
import { computeReaction } from "./reaction.ts";
import { excludeCandidates, sortArticles } from "./select.ts";
import type { Source } from "./source.ts";
import { createStore } from "./store.ts";

const DATA_DIR = fileURLToPath(new URL("../../data", import.meta.url));

/** 今日の日付（JST の YYYY-MM-DD） */
function todayJst(now: Date): string {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

/** 毎朝の流れ。取得に失敗したら、その日の一覧がなければ失敗の印を置いて、失敗で終わる */
export async function run(deps: { source: Source; dataDir: string; now: Date }): Promise<void> {
  // キーワードのファイルが壊れていたら、data/ に何も書かずに失敗で終わる
  loadKeywords();

  const date = todayJst(deps.now);
  const store = createStore(deps.dataDir);

  try {
    const items = await deps.source.fetchTop();
    if (items.length === 0) throw new Error("注目記事が1件も取れませんでした");

    // 取った全件を、その日の記録にする（一覧に載せないものも、反響の比べる相手になる）
    await store.writeHistory(
      date,
      items.map(({ id, score, comments }) => ({ id, score, comments })),
    );

    const recentIds = await store.recentArticleIds(date, config.excludeDays);
    const history = await store.readHistory(date, config.reactionDays);
    const candidates = excludeCandidates(items, { minScore: config.minScore, recentIds });

    // AI を使えない日：キーワードでの仕分けはせず、反響の順に載せる
    const articles: Article[] = candidates.map((i) => ({
      id: i.id,
      source: "hackernews",
      ...(i.postType && { postType: i.postType }),
      titleEn: i.titleEn,
      url: i.url,
      domain: i.domain,
      reaction: computeReaction(i, history),
    }));
    const list: DailyList = {
      date,
      status: "no-ai",
      articles: sortArticles(articles).slice(0, config.listSize),
    };
    await store.writeList(list);
    await store.writeLatest(date);
  } catch (e) {
    await store.writeFailedIfAbsent(date);
    await store.writeLatest(date);
    throw e;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run({ source: createHackerNews(), dataDir: DATA_DIR, now: new Date() }).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
