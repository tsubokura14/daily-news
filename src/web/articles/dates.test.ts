import { describe, expect, it } from "vitest";
import {
  canGoNext,
  canGoPrev,
  canShowMonth,
  formatDate,
  isSelectable,
  monthDays,
  oldestDate,
  shiftDate,
  shiftMonth,
  todayJst,
} from "./dates.ts";

const LATEST = "2026-10-17";

describe("oldestDate", () => {
  it("いちばん新しい日から89日前（直近90日の端）", () => {
    expect(oldestDate(LATEST)).toBe("2026-07-20");
  });
});

describe("canGoPrev", () => {
  it("いちばん古い日では前へ進めず、その翌日では進める", () => {
    expect(canGoPrev("2026-07-20", LATEST)).toBe(false);
    expect(canGoPrev("2026-07-21", LATEST)).toBe(true);
  });
});

describe("canGoNext", () => {
  it("いちばん新しい日では先へ進めず、その前日では進める", () => {
    expect(canGoNext(LATEST, LATEST)).toBe(false);
    expect(canGoNext("2026-10-16", LATEST)).toBe(true);
  });
});

describe("shiftDate", () => {
  it("月や年をまたいで日を動かす", () => {
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDate("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("formatDate", () => {
  it("月日と曜日にする（0は付けない）", () => {
    expect(formatDate("2026-10-17")).toBe("10/17（土）");
    expect(formatDate("2026-07-20")).toBe("7/20（月）");
  });
});

describe("isSelectable", () => {
  it("カレンダーで押せるのは、いちばん古い日からいちばん新しい日まで（両端を含む）", () => {
    expect(isSelectable("2026-07-19", LATEST)).toBe(false);
    expect(isSelectable("2026-07-20", LATEST)).toBe(true);
    expect(isSelectable(LATEST, LATEST)).toBe(true);
    expect(isSelectable("2026-10-18", LATEST)).toBe(false);
  });
});

describe("todayJst", () => {
  it("UTC では前日でも、JST の日付で返す（15時 UTC で日が変わる）", () => {
    expect(todayJst(new Date("2026-10-16T14:59:59Z"))).toBe("2026-10-16");
    expect(todayJst(new Date("2026-10-16T15:00:00Z"))).toBe("2026-10-17");
  });
});

describe("monthDays", () => {
  it("月の1日の曜日まで空きを置き、月の日数だけ日付を並べる", () => {
    // 2026-10-01 は木曜（日曜始まりで4つ空く）
    const days = monthDays("2026-10");
    expect(days.slice(0, 5)).toEqual([null, null, null, null, "2026-10-01"]);
    expect(days.filter(Boolean)).toHaveLength(31);
    expect(days.at(-1)).toBe("2026-10-31");
  });

  it("うるう年の2月は29日まで", () => {
    expect(monthDays("2028-02").filter(Boolean)).toHaveLength(29);
  });
});

describe("shiftMonth", () => {
  it("年をまたいで月を動かす", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
});

describe("canShowMonth", () => {
  it("押せる日がある月だけ見せる（いちばん古い日の月からいちばん新しい日の月まで）", () => {
    expect(canShowMonth("2026-06", LATEST)).toBe(false);
    expect(canShowMonth("2026-07", LATEST)).toBe(true);
    expect(canShowMonth("2026-10", LATEST)).toBe(true);
    expect(canShowMonth("2026-11", LATEST)).toBe(false);
  });
});
