import { Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";

/** 元記事の HTML から、本文の文字だけを取り出して maxChars で切る。取れなければ null */
export function extractBody(html: string, maxChars: number): string | null {
  // 元記事の CSS を読まず、その警告も出さない（本文の文字だけが要る）
  const dom = new JSDOM(html, { virtualConsole: new VirtualConsole() });
  const text = new Readability(dom.window.document).parse()?.textContent?.trim();
  return text ? text.slice(0, maxChars) : null;
}

/** 元記事を取って本文の文字にする。HTML でない・取れない・時間がかかりすぎるときは null */
export async function fetchBody(
  url: string,
  options: { maxChars: number; fetch?: typeof fetch; timeoutMs?: number },
): Promise<string | null> {
  try {
    const res = await (options.fetch ?? fetch)(url, {
      signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
      // 名乗りのない通信を断るサイトがあるため、連絡先つきで名乗る
      headers: { "user-agent": "daily-news/1.0 (+https://github.com/tsubokura14/daily-news)" },
    });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("html")) return null;
    return extractBody(await res.text(), options.maxChars);
  } catch {
    return null;
  }
}

/** 投稿の文章（HTML の断片）を、段落を改行にした文字にする */
export function htmlToText(html: string): string {
  const withBreaks = html.replace(/<(p|br)\s*\/?>/gi, "\n");
  return (new JSDOM(withBreaks).window.document.body.textContent ?? "").trim();
}
