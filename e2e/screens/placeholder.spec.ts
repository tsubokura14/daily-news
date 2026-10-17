import { expect, test } from "@playwright/test";

// アプリ名だけの空のページ。最初の画面の Issue で、本物の画面に置き換えて消す
test("placeholder-default", async ({ page }) => {
  // 日付など、撮るたびに変わるものを固定する
  await page.clock.install({ time: new Date("2026-01-01T07:00:00+09:00") });
  await page.goto("./");
  await page.evaluate("document.fonts.ready");
  await expect(page).toHaveScreenshot("placeholder-default.png");
});
