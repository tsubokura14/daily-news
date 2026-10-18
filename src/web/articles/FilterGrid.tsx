import { type Filter, type FilterCell, sameFilter } from "./filter.ts";

type Props = {
  cells: FilterCell[];
  selected: Filter;
  onSelect: (filter: Filter) => void;
};

/** すべて・カテゴリ・キーワード外の等幅のマス目（形と並びは docs/ui.md） */
export function FilterGrid({ cells, selected, onSelect }: Props) {
  return (
    <div className="border-b border-line">
      <fieldset
        aria-label="絞り込み"
        className="mx-auto grid min-w-0 max-w-4xl grid-cols-4 gap-1 px-4 py-2 md:grid-cols-6"
      >
        {cells.map(({ filter, label, count }) => {
          const on = sameFilter(filter, selected);
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(filter)}
              className={`flex h-8 items-center justify-center gap-1 rounded-lg text-xs ${
                on ? "bg-ink font-bold text-bg" : "bg-surface"
              }`}
            >
              {label}
              <span className={on ? "opacity-60" : count === 0 ? "text-line" : "text-muted"}>
                {count}
              </span>
            </button>
          );
        })}
      </fieldset>
    </div>
  );
}
