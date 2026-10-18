import { Readability } from "@mozilla/readability";
import { JSDOM, VirtualConsole } from "jsdom";

/** 元記事の HTML から、本文の文字だけを取り出して maxChars で切る。取れなければ null */
export function extractBody(html: string, maxChars: number): string | null {
  // 元記事の CSS を読まず、その警告も出さない（本文の文字だけが要る）
  const dom = new JSDOM(html, { virtualConsole: new VirtualConsole() });
  const text = new Readability(dom.window.document).parse()?.textContent?.trim();
  return text ? text.slice(0, maxChars) : null;
}

/** 投稿の文章（HTML の断片）を、段落を改行にした文字にする */
export function htmlToText(html: string): string {
  const withBreaks = html.replace(/<(p|br)\s*\/?>/gi, "\n");
  return (new JSDOM(withBreaks).window.document.body.textContent ?? "").trim();
}
