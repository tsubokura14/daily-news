import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { currentTheme, setTheme } from "./theme.ts";

function osPrefers(scheme: "light" | "dark") {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("dark") && scheme === "dark",
  })) as typeof window.matchMedia;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.style.colorScheme = "";
});

afterEach(() => {
  localStorage.clear();
});

describe("currentTheme", () => {
  it("覚えていなければ OS の設定に従う", () => {
    osPrefers("dark");
    expect(currentTheme()).toBe("dark");
    osPrefers("light");
    expect(currentTheme()).toBe("light");
  });

  it("覚えている選択が、OS の設定より先", () => {
    osPrefers("dark");
    localStorage.setItem("daily-news-theme", "light");
    expect(currentTheme()).toBe("light");
  });

  it("覚えている値が壊れていたら、OS の設定に従う", () => {
    osPrefers("dark");
    localStorage.setItem("daily-news-theme", "sepia");
    expect(currentTheme()).toBe("dark");
  });
});

describe("setTheme", () => {
  it("ブラウザに覚え、color-scheme を変える", () => {
    osPrefers("light");
    setTheme("dark");
    expect(localStorage.getItem("daily-news-theme")).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(currentTheme()).toBe("dark");
  });
});
