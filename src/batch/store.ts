import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { DailyList } from "../shared/articles.ts";

/** その日に取った注目記事の記録。反響の比べる相手 */
export type HistoryRecord = { id: string; score: number; comments: number };

/** YYYY-MM-DD の日付を、日数ぶんずらす */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

/** `data/` の読み書き。古い日のファイルは消さない（保存した記事を、90日より後も読めるように） */
export function createStore(dataDir: string) {
  const listPath = (date: string) => join(dataDir, "articles", `${date}.json`);
  const historyPath = (date: string) => join(dataDir, "history", `${date}.json`);

  const readList = (date: string) => readJson<DailyList>(listPath(date));

  return {
    readList,
    writeList: (list: DailyList) => writeJson(listPath(list.date), list),
    writeLatest: (date: string) => writeJson(join(dataDir, "latest.json"), { date }),
    writeHistory: (date: string, records: HistoryRecord[]) => writeJson(historyPath(date), records),

    /** date の前の days 日（date は含まない）の一覧に載せた記事の ID */
    async recentArticleIds(date: string, days: number): Promise<Set<string>> {
      const ids = new Set<string>();
      for (let n = 1; n <= days; n++) {
        const list = await readList(addDays(date, -n));
        for (const a of list?.articles ?? []) ids.add(a.id);
      }
      return ids;
    },

    /** date を含む直近 days 日の記録。同じ記事は新しい日の値を使う */
    async readHistory(date: string, days: number): Promise<HistoryRecord[]> {
      const from = addDays(date, -(days - 1));
      let files: string[];
      try {
        files = await readdir(join(dataDir, "history"));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
        throw e;
      }
      const dates = files
        .map((f) => f.replace(/\.json$/, ""))
        .filter((d) => d >= from && d <= date)
        .sort();
      const byId = new Map<string, HistoryRecord>();
      for (const d of dates) {
        for (const r of (await readJson<HistoryRecord[]>(historyPath(d))) ?? []) byId.set(r.id, r);
      }
      return [...byId.values()];
    },

    /** その日の一覧がまだなければ、取得に失敗した印の空の一覧を置く。あれば残す */
    async writeFailedIfAbsent(date: string): Promise<void> {
      if (await readList(date)) return;
      await writeJson(listPath(date), { date, status: "failed", articles: [] } satisfies DailyList);
    },
  };
}
