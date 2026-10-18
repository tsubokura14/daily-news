import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DailyList } from "../../shared/articles.ts";
import { makeArticle } from "./testing.ts";
import { useDailyList } from "./useDailyList.ts";

const json = (body: unknown) => new Response(JSON.stringify(body));
const list = (date: string): DailyList => ({ date, status: "ok", articles: [makeArticle(date)] });

/** URL の末尾が合う返事を返す。どれにも合わなければ 404 */
function stubFetch(routes: Record<string, () => Response>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.endsWith(k));
    return key ? routes[key]() : new Response("", { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useDailyList", () => {
  it("latest.json の日の一覧を読む（ログインの情報は送らない）", async () => {
    const fetchMock = stubFetch({
      "latest.json": () => json({ date: "2026-10-16" }),
      "articles/2026-10-16.json": () => json(list("2026-10-16")),
    });
    const { result } = renderHook(() => useDailyList());
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    expect(result.current.date).toBe("2026-10-16");
    expect(result.current.latest).toBe("2026-10-16");
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.headers).toBeUndefined();
    }
  });

  it("その日のファイルがなければ「記事がない日」（404）", async () => {
    stubFetch({ "latest.json": () => json({ date: "2026-10-17" }) });
    const { result } = renderHook(() => useDailyList());
    await waitFor(() => expect(result.current.state.status).toBe("missing"));
  });

  it("404 以外の失敗はエラーで、reload で読み直せる", async () => {
    let fail = true;
    stubFetch({
      "latest.json": () => json({ date: "2026-10-17" }),
      "articles/2026-10-17.json": () =>
        fail ? new Response("", { status: 500 }) : json(list("2026-10-17")),
    });
    const { result } = renderHook(() => useDailyList());
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    fail = false;
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
  });

  it("latest.json が読めなければ、日付はなくエラー", async () => {
    stubFetch({ "latest.json": () => new Response("", { status: 500 }) });
    const { result } = renderHook(() => useDailyList());
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.date).toBeNull();
  });

  it("select で別の日のファイルを読む", async () => {
    stubFetch({
      "latest.json": () => json({ date: "2026-10-17" }),
      "articles/2026-10-17.json": () => json(list("2026-10-17")),
      "articles/2026-10-16.json": () => json(list("2026-10-16")),
    });
    const { result } = renderHook(() => useDailyList());
    await waitFor(() => expect(result.current.state.status).toBe("ready"));
    act(() => result.current.select("2026-10-16"));
    await waitFor(() => {
      const { state } = result.current;
      expect(state.status === "ready" && state.list.date).toBe("2026-10-16");
    });
    expect(result.current.latest).toBe("2026-10-17");
  });
});
