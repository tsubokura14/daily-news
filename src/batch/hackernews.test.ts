import { describe, expect, it } from "vitest";
import { createHackerNews, detectPostType, toSourceItem } from "./hackernews.ts";

const story = (over: Record<string, unknown> = {}) => ({
  id: 1,
  type: "story",
  title: "A title",
  url: "https://www.example.com/post",
  score: 120,
  descendants: 30,
  ...over,
});

describe("detectPostType", () => {
  it("タイトルの頭の Show HN: と Ask HN: で判定する", () => {
    expect(detectPostType("Show HN: My tool")).toBe("show");
    expect(detectPostType("Ask HN: How do you test?")).toBe("ask");
  });

  it("頭にないときは判定しない", () => {
    expect(detectPostType("A look at Show HN: culture")).toBeUndefined();
  });
});

describe("toSourceItem", () => {
  it("記事の形にする（ドメインの www. は外す）", () => {
    expect(toSourceItem(story())).toEqual({
      id: "hn-1",
      titleEn: "A title",
      url: "https://www.example.com/post",
      domain: "example.com",
      score: 120,
      comments: 30,
    });
  });

  it("Ask HN は、リンクを HN のページにし、投稿の文章を本文にする", () => {
    const item = toSourceItem(
      story({ id: 7, title: "Ask HN: Why?", url: undefined, text: "Hello<p>World &amp; more" }),
    );
    expect(item).toMatchObject({
      id: "hn-7",
      postType: "ask",
      url: "https://news.ycombinator.com/item?id=7",
      domain: "news.ycombinator.com",
      text: "Hello\nWorld & more",
    });
  });

  it("コメント数がないときは0にする", () => {
    expect(toSourceItem(story({ descendants: undefined }))?.comments).toBe(0);
  });

  it("削除・無効の投稿と、記事以外（求人など）は外す", () => {
    expect(toSourceItem(story({ deleted: true }))).toBeNull();
    expect(toSourceItem(story({ dead: true }))).toBeNull();
    expect(toSourceItem(story({ type: "job" }))).toBeNull();
    expect(toSourceItem(null)).toBeNull();
  });
});

describe("createHackerNews", () => {
  const ids = Array.from({ length: 25 }, (_, i) => i + 1);

  it("同時に10件までずつ取り、取れなかった1件は外す", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const fetchJson = async (url: string) => {
      if (url.endsWith("/topstories.json")) return ids;
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight--;
      const id = Number(url.match(/item\/(\d+)\.json/)?.[1]);
      if (id === 3) throw new Error("通信に失敗");
      return story({ id });
    };
    const items = await createHackerNews({ fetchJson }).fetchTop();
    expect(items).toHaveLength(24);
    expect(items[0]?.id).toBe("hn-1");
    expect(maxInFlight).toBe(10);
  });

  it("注目記事の一覧が取れなければ失敗する", async () => {
    const fetchJson = async () => {
      throw new Error("通信に失敗");
    };
    await expect(createHackerNews({ fetchJson }).fetchTop()).rejects.toThrow();
  });
});
