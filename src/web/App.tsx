import { useState } from "react";
import { ArticleCard } from "./articles/ArticleCard.tsx";
import { CATEGORY_NAMES } from "./articles/categories.ts";
import { canGoNext, canGoPrev, shiftDate } from "./articles/dates.ts";
import { FilterGrid } from "./articles/FilterGrid.tsx";
import { ALL, applyFilter, type Filter, filterCells } from "./articles/filter.ts";
import { Header } from "./articles/Header.tsx";
import { EmptyDay, EmptyFilter, LoadError, OutsideHeading, Skeleton } from "./articles/States.tsx";
import { useDailyList } from "./articles/useDailyList.ts";
import { currentTheme, setTheme, type Theme } from "./theme.ts";

export function App() {
  const { date, latest, state, select, reload } = useDailyList();
  const [filter, setFilter] = useState<Filter>(ALL);
  const [theme, setThemeState] = useState<Theme>(currentTheme);

  const canPrev = !!date && !!latest && canGoPrev(date, latest);
  const canNext = !!date && !!latest && canGoNext(date, latest);
  const move = (days: number) => date && select(shiftDate(date, days));
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
  };

  function body() {
    if (state.status === "loading") return <Skeleton />;
    if (state.status === "error") return <LoadError onReload={reload} />;
    if (state.status === "missing" || state.list.articles.length === 0) {
      return <EmptyDay onPrev={canPrev ? () => move(-1) : null} />;
    }

    const { list } = state;
    const visible = applyFilter(list.articles, filter);
    // AI を使えなかった日（no-ai）は、キーワードで仕分けていないので、絞り込みを出さない
    const filterable = list.status === "ok";
    // 見出し「キーワード外」は、すべてを見ているときだけ、キーワード外の最初の記事の前に置く
    const firstOutside = filter.kind === "all" ? visible.findIndex((a) => !a.keyword) : -1;

    return (
      <>
        {filterable && (
          <FilterGrid
            cells={filterCells(list.articles, CATEGORY_NAMES)}
            selected={filter}
            onSelect={setFilter}
          />
        )}
        {visible.length === 0 ? (
          <EmptyFilter
            name={filter.kind === "category" ? filter.name : "キーワード外"}
            onReset={() => setFilter(ALL)}
          />
        ) : (
          <main className="mx-auto max-w-4xl px-4 py-4">
            <ul className="flex flex-col gap-3">
              {visible.map((article, i) => (
                <li key={article.id}>
                  {i === firstOutside && <OutsideHeading />}
                  <ArticleCard article={article} />
                </li>
              ))}
            </ul>
          </main>
        )}
      </>
    );
  }

  return (
    <>
      <Header
        date={date}
        canPrev={canPrev}
        canNext={canNext}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      {body()}
    </>
  );
}
