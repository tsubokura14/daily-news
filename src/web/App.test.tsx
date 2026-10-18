import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DailyList } from "../shared/articles.ts";
import { App } from "./App.tsx";
import { EmptyDay } from "./articles/States.tsx";
import { makeArticle, makeOutside } from "./articles/testing.ts";

const json = (body: unknown) => new Response(JSON.stringify(body));
const list = (articles: DailyList["articles"], status: DailyList["status"] = "ok"): DailyList => ({
  date: "2026-10-17",
  status,
  articles,
});

/** URL の末尾が合う返事を返す。どれにも合わなければ 404 */
function stubFetch(routes: Record<string, () => Response>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.endsWith(k));
    return key ? routes[key]() : new Response("", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function stubDay(day: DailyList) {
  return stubFetch({
    "latest.json": () => json({ date: "2026-10-17" }),
    "articles/2026-10-17.json": () => json(day),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("見出し「キーワード外」", () => {
  it("キーワード外の記事がある日は、見出しと補足を出す", async () => {
    stubDay(list([makeArticle("1"), makeOutside("2")]));
    render(<App />);
    expect(await screen.findByRole("heading", { name: "キーワード外" })).toBeInTheDocument();
    expect(screen.getByText("キーワードに一致しない、反響上位の記事")).toBeInTheDocument();
  });

  it("キーワード外の記事がない日は、見出しを出さない", async () => {
    stubDay(list([makeArticle("1")]));
    render(<App />);
    await screen.findByText("日本語の見出し 1");
    expect(screen.queryByRole("heading", { name: "キーワード外" })).not.toBeInTheDocument();
  });
});

describe("リンク", () => {
  it("元記事は「記事を開く」、Ask HN は「HN で開く」で、どちらも新しいタブで開く", async () => {
    stubDay(
      list([
        makeArticle("1"),
        makeArticle("2", { postType: "ask", url: "https://news.ycombinator.com/item?id=2" }),
      ]),
    );
    render(<App />);
    const open = await screen.findByRole("link", { name: /記事を開く/ });
    expect(open).toHaveAttribute("href", "https://example.com/1");
    expect(open).toHaveAttribute("target", "_blank");
    const hn = screen.getByRole("link", { name: /HN で開く/ });
    expect(hn).toHaveAttribute("href", "https://news.ycombinator.com/item?id=2");
    expect(hn).toHaveAttribute("target", "_blank");
  });
});

describe("絞り込み", () => {
  it("記事のないカテゴリを選ぶと案内を出し、「すべて表示」で戻る", async () => {
    stubDay(list([makeArticle("1")]));
    render(<App />);
    await screen.findByText("日本語の見出し 1");
    fireEvent.click(screen.getByRole("button", { name: /^IT業界/ }));
    expect(screen.getByText("「IT業界」の記事はありません")).toBeInTheDocument();
    expect(screen.getByText("この日は該当する記事がありません。")).toBeInTheDocument();
    expect(screen.queryByText("日本語の見出し 1")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "すべて表示" }));
    expect(screen.getByText("日本語の見出し 1")).toBeInTheDocument();
  });
});

describe("その日が0件", () => {
  it("案内と「前日へ」を出し、絞り込みのマス目は出さない。「前日へ」で前の日を読む", async () => {
    const fetchMock = stubFetch({
      "latest.json": () => json({ date: "2026-10-17" }),
      "articles/2026-10-17.json": () => json(list([], "failed")),
    });
    render(<App />);
    expect(await screen.findByText("この日の記事はありません")).toBeInTheDocument();
    expect(screen.getByText("該当する記事がないか、取得に失敗した日です。")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "絞り込み" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /前日へ/ }));
    await waitFor(() =>
      expect(fetchMock.mock.calls.map(([url]) => String(url))).toContainEqual(
        expect.stringMatching(/articles\/2026-10-16\.json$/),
      ),
    );
  });

  it("いちばん古い日（前へ進めない）では「前日へ」を出さない", () => {
    render(<EmptyDay onPrev={null} />);
    expect(screen.getByText("この日の記事はありません")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /前日へ/ })).not.toBeInTheDocument();
  });
});

describe("読み込みに失敗した", () => {
  it("案内と「再読み込み」を出し、押すと読み直す", async () => {
    let fail = true;
    stubFetch({
      "latest.json": () => json({ date: "2026-10-17" }),
      "articles/2026-10-17.json": () =>
        fail ? new Response("", { status: 500 }) : json(list([makeArticle("1")])),
    });
    render(<App />);
    expect(await screen.findByText("読み込みに失敗しました")).toBeInTheDocument();
    expect(screen.getByText("接続を確認して、再読み込みしてください。")).toBeInTheDocument();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: /再読み込み/ }));
    expect(await screen.findByText("日本語の見出し 1")).toBeInTheDocument();
  });
});
