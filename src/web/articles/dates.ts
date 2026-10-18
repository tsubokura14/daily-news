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

/** カレンダーで押せる日。一覧を読める範囲（いちばん古い日からいちばん新しい日まで） */
export const isSelectable = (date: string, latest: string) =>
  date >= oldestDate(latest) && date <= latest;

/** JST の今日。JST は UTC+9 で、夏時間がない */
export function todayJst(now: Date): string {
  return new Date(now.getTime() + 9 * 3_600_000).toISOString().slice(0, 10);
}

/** 月（YYYY-MM）のカレンダーの並び。1日の曜日まで、先頭に空き（null）を置く。日曜始まり */
export function monthDays(month: string): (string | null)[] {
  const first = `${month}-01`;
  const lead = new Date(toMs(first)).getUTCDay();
  const next = shiftMonth(month, 1);
  const count = (toMs(`${next}-01`) - toMs(first)) / DAY_MS;
  return [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: count }, (_, i) => shiftDate(first, i)),
  ];
}

export function shiftMonth(month: string, months: number): string {
  const [year, m] = month.split("-").map(Number);
  const index = year * 12 + (m - 1) + months;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** 押せる日がある月だけ、カレンダーで見せる */
export const canShowMonth = (month: string, latest: string) =>
  month >= oldestDate(latest).slice(0, 7) && month <= latest.slice(0, 7);
