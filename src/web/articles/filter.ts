import type { Article } from "../../shared/articles.ts";

export type Filter = { kind: "all" } | { kind: "outside" } | { kind: "category"; name: string };

export type FilterCell = { filter: Filter; label: string; count: number };

export const ALL: Filter = { kind: "all" };

export function sameFilter(a: Filter, b: Filter): boolean {
  if (a.kind === "category" && b.kind === "category") return a.name === b.name;
  return a.kind === b.kind;
}

export function applyFilter(articles: Article[], filter: Filter): Article[] {
  switch (filter.kind) {
    case "all":
      return articles;
    case "outside":
      return articles.filter((a) => !a.keyword);
    case "category":
      return articles.filter((a) => a.keyword?.category === filter.name);
  }
}

/** マス目になる、すべて・カテゴリ・キーワード外。件数が0のカテゴリも残す（場所を変えないため） */
export function filterCells(articles: Article[], categoryNames: string[]): FilterCell[] {
  const cell = (filter: Filter, label: string): FilterCell => ({
    filter,
    label,
    count: applyFilter(articles, filter).length,
  });
  return [
    cell(ALL, "すべて"),
    ...categoryNames.map((name) => cell({ kind: "category", name }, name)),
    cell({ kind: "outside" }, "キーワード外"),
  ];
}
