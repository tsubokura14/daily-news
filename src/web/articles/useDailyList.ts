import { useCallback, useEffect, useState } from "react";
import type { DailyList } from "../../shared/articles.ts";

export type DayState =
  | { status: "loading" }
  | { status: "error" }
  /** その日のファイルがない（404） */
  | { status: "missing" }
  | { status: "ready"; list: DailyList };

type Latest = { status: "loading" } | { status: "error" } | { status: "ready"; date: string };

/** JSON を取る。404 は null、ほかの失敗は例外 */
async function getJson(path: string): Promise<unknown | null> {
  const res = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${path}：${res.status}`);
  return res.json();
}

async function loadLatest(): Promise<string> {
  const body = (await getJson("latest.json")) as { date?: unknown } | null;
  if (typeof body?.date !== "string") throw new Error("latest.json の形が違います");
  return body.date;
}

async function loadDay(date: string): Promise<DailyList | null> {
  const body = (await getJson(`articles/${date}.json`)) as DailyList | null;
  if (body && !Array.isArray(body.articles)) throw new Error(`${date} の一覧の形が違います`);
  return body;
}

/**
 * いちばん新しい日（latest.json）と、見ている日の一覧を読む。
 * 7:00 より前に開いたときの前日の一覧も、latest.json の日として出る。
 * 日付は URL に入れず、ここで持つ（ルーターを入れないため）
 */
export function useDailyList() {
  const [latest, setLatest] = useState<Latest>({ status: "loading" });
  const [selected, setSelected] = useState<string | null>(null);
  const [day, setDay] = useState<DayState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  const latestDate = latest.status === "ready" ? latest.date : null;
  const date = selected ?? latestDate;

  // attempt は、「再読み込み」で読み直すための合図
  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt を変えたときに読み直す
  useEffect(() => {
    let cancelled = false;
    setLatest({ status: "loading" });
    loadLatest().then(
      (d) => !cancelled && setLatest({ status: "ready", date: d }),
      () => !cancelled && setLatest({ status: "error" }),
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: attempt を変えたときに読み直す
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setDay({ status: "loading" });
    loadDay(date).then(
      (list) => !cancelled && setDay(list ? { status: "ready", list } : { status: "missing" }),
      () => !cancelled && setDay({ status: "error" }),
    );
    return () => {
      cancelled = true;
    };
  }, [date, attempt]);

  const state: DayState = latest.status === "ready" ? day : latest;
  return {
    latest: latestDate,
    date,
    state,
    select: setSelected,
    reload: useCallback(() => setAttempt((n) => n + 1), []),
  };
}
