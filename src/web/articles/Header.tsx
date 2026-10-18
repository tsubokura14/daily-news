import { useState } from "react";
import { Icon } from "../icons.tsx";
import type { Theme } from "../theme.ts";
import { Calendar } from "./Calendar.tsx";
import { formatDate } from "./dates.ts";

type Props = {
  /** 見ている日。いちばん新しい日が分からない間は null（日付の切り替えを出さない） */
  date: string | null;
  /** いちばん新しい日。カレンダーの範囲を決める */
  latest: string | null;
  onSelect: (date: string) => void;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  theme: Theme;
  onToggleTheme: () => void;
};

const iconButton = "flex size-9 items-center justify-center rounded-full text-muted";
const segment =
  "flex h-10 w-8 items-center justify-center text-ink disabled:text-line disabled:cursor-default";

export function Header({
  date,
  latest,
  onSelect,
  canPrev,
  canNext,
  onPrev,
  onNext,
  theme,
  onToggleTheme,
}: Props) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  return (
    <header className="border-b border-line bg-surface">
      <div className="relative mx-auto flex h-14 max-w-4xl items-center gap-2 px-4">
        <h1 className="shrink-0 whitespace-nowrap font-brand text-lg font-black">Daily News</h1>
        {date && (
          <div className="flex items-center overflow-hidden rounded-full border border-line md:ml-auto">
            <button
              type="button"
              aria-label="前の日"
              disabled={!canPrev}
              onClick={onPrev}
              className={segment}
            >
              <Icon name="chevronLeft" className="size-5" />
            </button>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={calendarOpen}
              onClick={() => setCalendarOpen(true)}
              className="flex h-10 items-center whitespace-nowrap border-x border-line px-3.5 text-sm"
            >
              {formatDate(date)}
            </button>
            <button
              type="button"
              aria-label="次の日"
              disabled={!canNext}
              onClick={onNext}
              className={segment}
            >
              <Icon name="chevronRight" className="size-5" />
            </button>
          </div>
        )}
        {date && latest && calendarOpen && (
          <Calendar
            date={date}
            latest={latest}
            onSelect={(d) => {
              setCalendarOpen(false);
              onSelect(d);
            }}
            onClose={() => setCalendarOpen(false)}
          />
        )}
        <div className="ml-auto flex items-center md:ml-0">
          <button
            type="button"
            aria-label={theme === "dark" ? "ライトにする" : "ダークにする"}
            onClick={onToggleTheme}
            className={iconButton}
          >
            <Icon name={theme === "dark" ? "lightMode" : "darkMode"} className="size-5" />
          </button>
          {/* 押しても何も起きない。Google のログインにつなぐのは #3 */}
          <button type="button" aria-label="ログイン" className={iconButton}>
            <Icon name="login" className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
