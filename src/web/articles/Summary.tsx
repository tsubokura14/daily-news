import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "../icons.tsx";

/** 要約を4行で切り、はみ出るときだけ「続きを表示」を出す。はみ出るかは、切った高さと全文の高さを比べて決める */
export function Summary({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: text が変わったら測り直す
  useLayoutEffect(() => {
    const el = ref.current;
    // 開いている間は切っていないので測れない。開く前の結果を残す
    if (!el || open) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    // 画面の幅が変わると、4行に収まるかも変わる
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, open]);

  return (
    <div className="mt-4">
      <p ref={ref} className={`text-sm leading-7 ${open ? "" : "line-clamp-4"}`}>
        {text}
      </p>
      {(overflows || open) && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="mt-1 flex items-center gap-0.5 py-1 text-sm font-medium text-link"
        >
          {open ? "折りたたむ" : "続きを表示"}
          <Icon name={open ? "expandLess" : "expandMore"} className="size-5" />
        </button>
      )}
    </div>
  );
}
