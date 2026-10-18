import { expect, type Page, test } from "@playwright/test";
import type { DailyList } from "../../src/shared/articles.ts";
import { defaultList, failedList, LATEST_DATE, manyList } from "../fixtures/articles.ts";

// 記事一覧の画面を、状態ごとに撮って基準と比べる。
// 状態は、ブラウザが取りに行く JSON の返事を差し替えて作る（理由は docs/design.md）

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

type Options = {
  list?: DailyList;
  /** 日ごとの一覧を、返事が来ない状態にする（読み込み中） */
  pending?: boolean;
  /** 日ごとの一覧を、失敗させる */
  fail?: boolean;
};

async function open(page: Page, { list = defaultList, pending, fail }: Options = {}) {
  // 日付など、撮るたびに変わるものを固定する（2026-10-17 の 7:30 JST）
  await page.clock.install({ time: new Date("2026-10-17T07:30:00+09:00") });
  await page.route("**/latest.json", (route) => route.fulfill({ json: { date: LATEST_DATE } }));
  await page.route("**/articles/*.json", (route) => {
    if (pending) return;
    if (fail) return route.fulfill({ status: 500 });
    return route.fulfill({ json: list });
  });
  await page.goto("./");
  await page.evaluate("document.fonts.ready");
}

// 合意した画面と同じ、2倍の細かさで撮る（文字の細部まで見比べられるように）
const shot = (page: Page, name: string) =>
  expect(page).toHaveScreenshot(`articles-${name}.png`, { fullPage: true, scale: "device" });

test("articles-default", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("heading", { name: "キーワード外" })).toBeVisible();
  await shot(page, "default");
});

test("articles-default-dark", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await open(page);
  await expect(page.getByRole("heading", { name: "キーワード外" })).toBeVisible();
  await shot(page, "default-dark");
});

test("articles-default-pc", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await open(page);
  await expect(page.getByRole("heading", { name: "キーワード外" })).toBeVisible();
  await shot(page, "default-pc");
});

test("articles-many", async ({ page }) => {
  await open(page, { list: manyList });
  await expect(page.getByRole("article")).toHaveCount(30);
  await shot(page, "many");
});

test("articles-summary-open", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "続きを表示" }).first().click();
  await expect(page.getByRole("button", { name: "折りたたむ" })).toBeVisible();
  await shot(page, "summary-open");
});

test("articles-loading", async ({ page }) => {
  await open(page, { pending: true });
  await expect(page.getByRole("list", { name: "読み込み中" })).toBeVisible();
  await shot(page, "loading");
});

test("articles-error", async ({ page }) => {
  await open(page, { fail: true });
  await expect(page.getByText("読み込みに失敗しました")).toBeVisible();
  await shot(page, "error");
});

test("articles-empty-day", async ({ page }) => {
  await open(page, { list: failedList });
  await expect(page.getByText("この日の記事はありません")).toBeVisible();
  await shot(page, "empty-day");
});

test("articles-empty-category", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: /^IT業界/ }).click();
  await expect(page.getByText("「IT業界」の記事はありません")).toBeVisible();
  await shot(page, "empty-category");
});

test("articles-oldest", async ({ page }) => {
  await open(page);
  const prev = page.getByRole("button", { name: "前の日" });
  // いちばん古い日（89日前）まで戻る
  for (let i = 0; i < 89; i++) await prev.click();
  await expect(page.getByText("7/20（月）")).toBeVisible();
  await expect(prev).toBeDisabled();
  await expect(page.getByRole("article").first()).toBeVisible();
  await shot(page, "oldest");
});
