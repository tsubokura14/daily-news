import { describe, expect, it } from "vitest";
import { canGoNext, canGoPrev, formatDate, oldestDate, shiftDate } from "./dates.ts";

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
