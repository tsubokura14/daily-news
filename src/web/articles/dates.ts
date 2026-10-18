/** 一覧を読める日数（いちばん新しい日を含む直近90日） */
const RANGE_DAYS = 90;
const DAY_MS = 86_400_000;
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

// 日付（YYYY-MM-DD）は、時刻や時差を持ち込まないよう、UTC の0時として扱う
const toMs = (date: string) => Date.parse(`${date}T00:00:00Z`);

export function shiftDate(date: string, days: number): string {
  return new Date(toMs(date) + days * DAY_MS).toISOString().slice(0, 10);
}

/** 選べるいちばん古い日。いちばん新しい日から89日前 */
export function oldestDate(latest: string): string {
  return shiftDate(latest, -(RANGE_DAYS - 1));
}

// YYYY-MM-DD は、文字の大小が日付の前後と同じ
export const canGoPrev = (date: string, latest: string) => date > oldestDate(latest);
export const canGoNext = (date: string, latest: string) => date < latest;

/** 「10/17（土）」の形 */
export function formatDate(date: string): string {
  const d = new Date(toMs(date));
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}（${WEEKDAYS[d.getUTCDay()]}）`;
}
