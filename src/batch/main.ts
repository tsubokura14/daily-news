import { fileURLToPath } from "node:url";
import type { Article, DailyList } from "../shared/articles.ts";
import { fetchBody as fetchBodyDefault } from "./body.ts";
import { resolveCategory } from "./category.ts";
import { config } from "./config.ts";
import { createGemini } from "./gemini.ts";
import { createHackerNews } from "./hackernews.ts";
import { loadKeywords } from "./keywords.ts";
import { computeReaction } from "./reaction.ts";
import { type Candidate, excludeCandidates, selectArticles, sortArticles } from "./select.ts";
import type { Source, SourceItem } from "./source.ts";
import { createStore } from "./store.ts";
import { AiReplyError, AiUnavailableError, type Summarizer } from "./summarizer.ts";

const DATA_DIR = fileURLToPath(new URL("../../data", import.meta.url));

/** 今日の日付（JST の YYYY-MM-DD） */
function todayJst(now: Date): string {
  return new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

const BODY_MISSING_NOTE = "（本文を読めなかったため、タイトルからの推測を含む）";

type Deps = {
  source: Source;
  dataDir: string;
  now: Date;
  /** なければ（キーが設定されていない）、AI を使わずに英語の一覧にする */
  summarizer?: Summarizer | null;
  fetchBody?: (url: string) => Promise<string | null>;
  sleep?: (ms: number) => Promise<void>;
};

/**
 * 毎朝の流れ。取得に失敗したら、その日の一覧がなければ失敗の印を置いて、失敗で終わる。
 *
 * AI の呼び方：分類は50件ずつまとめて、要約は1件ずつ、間を空けて送る。
 * 前提（崩れたら見直す）：無料枠の1日の回数の上限に当たるようになったら、要約もまとめて送る。
 */
export async function run(deps: Deps): Promise<void> {
  // キーワードのファイルが壊れていたら、data/ に何も書かずに失敗で終わる
  const keywords = loadKeywords();

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

    const articles: Article[] = candidates.map((i) => ({
      id: i.id,
      source: "hackernews",
      ...(i.postType && { postType: i.postType }),
      titleEn: i.titleEn,
      url: i.url,
      domain: i.domain,
      reaction: computeReaction(i, history),
    }));

    // AI を使えない日（キーがない、AI が使えない）：キーワードでの仕分けはせず、反響の順に載せる
    let list: DailyList = {
      date,
      status: "no-ai",
      articles: sortArticles(articles).slice(0, config.listSize),
    };
    if (deps.summarizer) {
      try {
        list = {
          date,
          status: "ok",
          articles: await aiArticles(deps.summarizer, candidates, articles, keywords, deps),
        };
      } catch (e) {
        if (!(e instanceof AiUnavailableError)) throw e;
        console.warn(`AI が使えなかったため、英語の一覧にします：${e.message}`);
      }
    }
    await store.writeList(list);
    await store.writeLatest(date);
  } catch (e) {
    await store.writeFailedIfAbsent(date);
    await store.writeLatest(date);
    throw e;
  }
}

/** 分類・選び方・要約を行い、表示する順に並べた記事を返す。AI が使えなければ AiUnavailableError */
async function aiArticles(
  ai: Summarizer,
  items: SourceItem[],
  articles: Article[],
  keywords: ReturnType<typeof loadKeywords>,
  deps: Pick<Deps, "fetchBody" | "sleep">,
): Promise<Article[]> {
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const fetchBody =
    deps.fetchBody ?? ((url: string) => fetchBodyDefault(url, { maxChars: config.maxBodyChars }));
  let called = false;
  const pause = async () => {
    if (called) await sleep(config.summarizeIntervalMs);
    called = true;
  };

  const byId = new Map(articles.map((a) => [a.id, a]));
  const itemById = new Map(items.map((i) => [i.id, i]));

  // 分類：返事が読めなかったまとまりの記事は、一覧から外す
  const candidates: Candidate[] = [];
  const keywordOf = new Map<
    string,
    { relevance: Candidate["relevance"]; keywords: string[]; category: string | null }
  >();
  for (let from = 0; from < items.length; from += config.classifyBatchSize) {
    const batch = items.slice(from, from + config.classifyBatchSize);
    await pause();
    let result: Awaited<ReturnType<Summarizer["classify"]>>;
    try {
      result = await ai.classify(
        batch.map(({ id, titleEn, domain }) => ({ id, titleEn, domain })),
        keywords,
      );
    } catch (e) {
      if (e instanceof AiReplyError) continue;
      throw e;
    }
    for (const c of result) {
      const reaction = byId.get(c.id)?.reaction;
      if (!reaction) continue;
      const resolved = resolveCategory(c.keywords, c.category, keywords);
      keywordOf.set(c.id, { relevance: c.relevance, ...resolved });
      candidates.push({ id: c.id, reaction, relevance: c.relevance, keywords: resolved.keywords });
    }
  }

  // どのまとまりも読めなかった日は、AI を使えなかった日として扱う
  if (items.length > 0 && keywordOf.size === 0) {
    throw new AiUnavailableError("分類の返事がどれも読めませんでした");
  }

  const { related, offKeyword } = selectArticles(candidates, {
    size: config.listSize,
    relatedRatio: config.relatedRatio,
    minRelevance: config.minRelevance,
    minOffKeywordReaction: config.minOffKeywordReaction,
  });

  // 要約：1件ずつ。返事が読めない記事は外す
  const result: Article[] = [];
  for (const c of [...related, ...offKeyword]) {
    const article = byId.get(c.id);
    const item = itemById.get(c.id);
    if (!article || !item) continue;
    // 元記事がない投稿（Ask HN）は、投稿の文章を使う
    const body = item.text?.slice(0, config.maxBodyChars) ?? (await fetchBody(item.url));
    await pause();
    try {
      const summary = await ai.summarize({ titleEn: item.titleEn, domain: item.domain, body });
      const k = keywordOf.get(c.id);
      result.push({
        ...article,
        ai: {
          titleJa: summary.titleJa,
          summary: body === null ? `${summary.summary}${BODY_MISSING_NOTE}` : summary.summary,
          importance: summary.importance,
        },
        ...(related.includes(c) &&
          k?.category && {
            keyword: { relevance: k.relevance, keywords: k.keywords, category: k.category },
          }),
      });
    } catch (e) {
      if (!(e instanceof AiReplyError)) throw e;
    }
  }
  return sortArticles(result);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const apiKey = process.env.GEMINI_API_KEY;
  const summarizer = apiKey
    ? createGemini({ apiKey, model: process.env.GEMINI_MODEL || config.defaultModel })
    : null;
  run({ source: createHackerNews(), dataDir: DATA_DIR, now: new Date(), summarizer }).catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
