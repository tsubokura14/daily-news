import { describe, expect, it } from "vitest";
import { extractBody } from "./body.ts";

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
