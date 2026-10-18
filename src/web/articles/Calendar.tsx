import { useState } from "react";
import { Icon } from "../icons.tsx";
import { canShowMonth, isSelectable, monthDays, shiftMonth, todayJst } from "./dates.ts";

type Props = {
  /** 見ている日 */
  date: string;
  latest: string;
  onSelect: (date: string) => void;
  onClose: () => void;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const arrow = "flex size-9 items-center justify-center rounded-full disabled:text-line";

/** 日付の下に開く、月のカレンダー。押せるのは一覧を読める直近90日の日だけ */
export function Calendar({ date, latest, onSelect, onClose }: Props) {
  const [month, setMonth] = useState(date.slice(0, 7));
  const today = todayJst(new Date());
  const [year, m] = month.split("-").map(Number);

  return (
    <>
      <button
        type="button"
        aria-label="カレンダーを閉じる"
        onClick={onClose}
        className="fixed inset-0 z-10 cursor-default"
      />
      <div
        role="dialog"
        aria-label="カレンダー"
        className="absolute top-full left-3 z-20 w-[286px] rounded-2xl border border-line bg-surface p-3 shadow-lg md:right-4 md:left-auto"
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="前の月"
            disabled={!canShowMonth(shiftMonth(month, -1), latest)}
            onClick={() => setMonth(shiftMonth(month, -1))}
            className={arrow}
          >
            <Icon name="chevronLeft" className="size-5" />
          </button>
          <span className="text-sm font-bold">
            {year}年{m}月
          </span>
          <button
            type="button"
            aria-label="次の月"
            disabled={!canShowMonth(shiftMonth(month, 1), latest)}
            onClick={() => setMonth(shiftMonth(month, 1))}
            className={arrow}
          >
            <Icon name="chevronRight" className="size-5" />
          </button>
        </div>

        <div className="mt-1 grid grid-cols-7 text-center text-xs text-muted">
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-2">
              {w}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 text-center text-sm">
          {monthDays(month).map((day, i) => {
            // 月の前の空き。位置が変わらないので、並び順の番号を key にする
            // biome-ignore lint/suspicious/noArrayIndexKey: 空きには日付がない
            if (!day) return <span key={i} />;
            const selected = day === date;
            return (
              <button
                key={day}
                type="button"
                aria-label={`${Number(day.slice(5, 7))}月${Number(day.slice(8))}日`}
                aria-current={day === today ? "date" : undefined}
                disabled={!isSelectable(day, latest)}
                onClick={() => onSelect(day)}
                className={`mx-auto my-0.5 flex size-9 items-center justify-center rounded-full disabled:text-line ${
                  selected
                    ? "bg-accent font-bold text-on-accent"
                    : day === today
                      ? "font-bold text-link"
                      : ""
                }`}
              >
                {Number(day.slice(8))}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-line pt-3 text-xs">
          <span className="text-muted">直近90日まで</span>
          <button
            type="button"
            onClick={() => onSelect(latest)}
            className="py-1 font-medium text-link"
          >
            最新へ
          </button>
        </div>
      </div>
    </>
  );
}
