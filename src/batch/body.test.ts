import { describe, expect, it } from "vitest";
import { extractBody, fetchBody } from "./body.ts";

const page = (body: string) =>
  `<html><head><title>T</title></head><body><nav>Home About</nav>${body}</body></html>`;
const paragraph = "This is a sentence about testing software in a careful way. ";

describe("extractBody", () => {
  it("本文の文字だけを取り出す（タグは含まない）", () => {
    const text = extractBody(
      page(`<article><h1>Title</h1><p>${paragraph.repeat(10)}</p></article>`),
      4000,
    );
    expect(text).toContain("This is a sentence about testing");
    expect(text).not.toContain("<p>");
  });

  it("最大文字数で切る", () => {
    const text = extractBody(page(`<article><p>${paragraph.repeat(30)}</p></article>`), 100);
    expect(text).toHaveLength(100);
  });

  it("本文が取れないときは null", () => {
    expect(extractBody("<html><body></body></html>", 4000)).toBeNull();
  });
});

describe("fetchBody", () => {
  const html = page(`<article><p>${paragraph.repeat(10)}</p></article>`);
  const respond = (body: string, init: ResponseInit = {}) =>
    (async () =>
      new Response(body, {
        headers: { "content-type": "text/html; charset=utf-8" },
        ...init,
      })) as typeof fetch;

  it("元記事の HTML を取って、本文の文字を返す", async () => {
    const text = await fetchBody("https://example.com/a", { fetch: respond(html), maxChars: 4000 });
    expect(text).toContain("This is a sentence about testing");
  });

  it("取れなかったとき（エラーの返事、通信の失敗、HTML でないもの）は null", async () => {
    const options = { maxChars: 4000 };
    expect(
      await fetchBody("https://example.com/a", {
        ...options,
        fetch: respond("x", { status: 404 }),
      }),
    ).toBeNull();
    const failing = (async () => {
      throw new Error("network");
    }) as typeof fetch;
    expect(await fetchBody("https://example.com/a", { ...options, fetch: failing })).toBeNull();
    const pdf = respond("%PDF", { headers: { "content-type": "application/pdf" } });
    expect(await fetchBody("https://example.com/a", { ...options, fetch: pdf })).toBeNull();
  });
});
