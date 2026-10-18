import { useId, useState } from "react";
import type { Level } from "../../shared/articles.ts";

export const HINTS = {
  関連度: "キーワードとの関連性（5段階・AI 判定）",
  重要度: "ニュースとしての重要性（5段階・AI 判定）",
  反響: "Hacker News の注目記事の直近30日と比べた反響（5段階・スコアとコメント数から算出）",
} as const;

/** 名前と5つの目盛り。5のときだけ accent で塗る。名前を押す（指を乗せる）と説明が出る */
export function Scale({ label, value }: { label: keyof typeof HINTS; value: Level }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="relative">
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
        className="flex items-center gap-1.5 py-1 text-xs text-muted"
      >
        {label}
        <span className="flex gap-0.5" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`h-2.5 w-1.5 rounded-full ${
                i > value ? "bg-line" : value === 5 ? "bg-accent" : "bg-muted"
              }`}
            />
          ))}
        </span>
        <span className="sr-only">{value} / 5</span>
      </button>
      {open && (
        <div
          id={id}
          role="tooltip"
          className="absolute bottom-full left-0 z-10 mb-1 w-56 rounded-lg bg-ink p-2 text-xs text-bg"
        >
          {HINTS[label]}
        </div>
      )}
    </div>
  );
}
