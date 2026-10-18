import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

describe("過去の日", () => {
  const routes = () => ({
    "latest.json": () => json({ date: "2026-10-17" }),
    "articles/2026-10-17.json": () => json(list([makeArticle("1")])),
    "articles/2026-10-16.json": () => json(list([makeArticle("2")])),
  });

  it("最新の日では帯を出さない。前の日へ移ると帯を出し、「最新へ」で戻ると消える", async () => {
    stubFetch(routes());
    render(<App />);
    await screen.findByText("日本語の見出し 1");
    expect(screen.queryByText(/の一覧を表示中/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "前の日" }));
    expect(await screen.findByText("10/16（金）の一覧を表示中")).toBeInTheDocument();
    expect(await screen.findByText("日本語の見出し 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /最新へ/ }));
    expect(await screen.findByText("日本語の見出し 1")).toBeInTheDocument();
    expect(screen.queryByText(/の一覧を表示中/)).not.toBeInTheDocument();
  });
});

describe("カレンダー", () => {
  const routes = () => ({
    "latest.json": () => json({ date: "2026-10-17" }),
    "articles/2026-10-17.json": () => json(list([makeArticle("1")])),
    "articles/2026-10-16.json": () => json(list([makeArticle("2")])),
  });
  const open = async () => {
    render(<App />);
    await screen.findByText("日本語の見出し 1");
    fireEvent.click(screen.getByRole("button", { name: /^10\/17/ }));
    return screen.getByRole("dialog", { name: "カレンダー" });
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  it("押せるのは一覧のある範囲の日だけ。いちばん新しい日より後は押せない", async () => {
    stubFetch(routes());
    const calendar = await open();
    expect(within(calendar).getByRole("button", { name: "10月17日" })).toBeEnabled();
    expect(within(calendar).getByRole("button", { name: "10月18日" })).toBeDisabled();
    // 7月19日は、いちばん古い日（7月20日）の前日
    fireEvent.click(within(calendar).getByRole("button", { name: "前の月" }));
    fireEvent.click(within(calendar).getByRole("button", { name: "前の月" }));
    fireEvent.click(within(calendar).getByRole("button", { name: "前の月" }));
    expect(within(calendar).getByText("2026年7月")).toBeInTheDocument();
    expect(within(calendar).getByRole("button", { name: "7月19日" })).toBeDisabled();
    expect(within(calendar).getByRole("button", { name: "7月20日" })).toBeEnabled();
    expect(within(calendar).getByRole("button", { name: "前の月" })).toBeDisabled();
  });

  it("日を選ぶとその日の一覧を読んで、閉じる", async () => {
    stubFetch(routes());
    const calendar = await open();
    fireEvent.click(within(calendar).getByRole("button", { name: "10月16日" }));
    expect(await screen.findByText("日本語の見出し 2")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "カレンダー" })).not.toBeInTheDocument();
  });

  it("外を押すと閉じる", async () => {
    stubFetch(routes());
    await open();
    fireEvent.click(screen.getByRole("button", { name: "カレンダーを閉じる" }));
    expect(screen.queryByRole("dialog", { name: "カレンダー" })).not.toBeInTheDocument();
  });

  it("「今日」の印は本当の今日に付く。その日の一覧がまだなければ押せない", async () => {
    // 10/18 7:30（JST）。取得はこれからで、latest.json はまだ10/17
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-10-18T07:30:00+09:00") });
    stubFetch(routes());
    const calendar = await open();
    const today = within(calendar).getByRole("button", { name: "10月18日" });
    expect(today).toHaveAttribute("aria-current", "date");
    expect(today).toBeDisabled();
  });
});

describe("AI を使えなかった日", () => {
  it("お知らせを出し、絞り込みのマス目は出さない", async () => {
    stubDay(list([makeOutside("1", { ai: undefined })], "no-ai"));
    render(<App />);
    expect(
      await screen.findByText(
        "AI 処理に失敗したため、この日は分類と要約がありません。英語タイトルを反響順に表示しています。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "絞り込み" })).not.toBeInTheDocument();
  });

  it("ふつうの日には、お知らせを出さない", async () => {
    stubDay(list([makeArticle("1")]));
    render(<App />);
    await screen.findByText("日本語の見出し 1");
    expect(screen.queryByText(/AI 処理に失敗したため/)).not.toBeInTheDocument();
  });
});
