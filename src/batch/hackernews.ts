import type { PostType } from "../shared/articles.ts";
import { htmlToText } from "./body.ts";
import type { Source, SourceItem } from "./source.ts";

const API = "https://hacker-news.firebaseio.com/v0";
const HN_PAGE = "https://news.ycombinator.com/item?id=";
/** HN の API はまとめて取れないので、同時にこの件数ずつ取る */
const CONCURRENCY = 10;

type HnItem = {
  id: number;
  type?: string;
  title?: string;
  url?: string;
  text?: string;
  score?: number;
  descendants?: number;
  deleted?: boolean;
  dead?: boolean;
};

/** 投稿の種類。タイトルの頭で判定する */
export function detectPostType(title: string): PostType | undefined {
  if (title.startsWith("Show HN:")) return "show";
  if (title.startsWith("Ask HN:")) return "ask";
  return undefined;
}

/** HN の1件を、ソースの記事の形にする。削除・無効の投稿と、記事以外（求人など）は null */
export function toSourceItem(raw: unknown): SourceItem | null {
  const hn = raw as HnItem | null;
  if (!hn || hn.deleted || hn.dead || hn.type !== "story" || !hn.title) return null;
  const postType = detectPostType(hn.title);
  const url = hn.url ?? `${HN_PAGE}${hn.id}`;
  const item: SourceItem = {
    id: `hn-${hn.id}`,
    titleEn: hn.title,
    url,
    domain: new URL(url).hostname.replace(/^www\./, ""),
    score: hn.score ?? 0,
    comments: hn.descendants ?? 0,
  };
  if (postType) item.postType = postType;
  if (!hn.url && hn.text) item.text = htmlToText(hn.text);
  return item;
}

async function defaultFetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`${url} が ${res.status} を返しました`);
  return res.json();
}

export function createHackerNews(
  options: { fetchJson?: (url: string) => Promise<unknown> } = {},
): Source {
  const fetchJson = options.fetchJson ?? defaultFetchJson;
  return {
    async fetchTop() {
      const ids = (await fetchJson(`${API}/topstories.json`)) as number[];
      const items: (SourceItem | null)[] = new Array(ids.length).fill(null);
      let next = 0;
      // 1件の失敗で全体を止めない。取れなかった記事は外す
      const worker = async () => {
        while (next < ids.length) {
          const i = next++;
          try {
            items[i] = toSourceItem(await fetchJson(`${API}/item/${ids[i]}.json`));
          } catch {}
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
      return items.filter((i): i is SourceItem => i !== null);
    },
  };
}
