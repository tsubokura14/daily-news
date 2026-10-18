import type { ReactNode } from "react";
import { Icon } from "../icons.tsx";

const outlineButton =
  "mt-6 inline-flex h-10 items-center gap-1 rounded-full border border-line px-5 text-sm";

function Message({
  icon,
  title,
  body,
  children,
}: {
  icon?: ReactNode;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-24 text-center">
      {icon}
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-2 text-sm text-muted">{body}</p>
      {children}
    </div>
  );
}

/** その日の記事が0件（取得に失敗した日を含む）。onPrev が null なら、前の日がないので「前日へ」を出さない */
export function EmptyDay({ onPrev }: { onPrev: (() => void) | null }) {
  return (
    <Message title="この日の記事はありません" body="該当する記事がないか、取得に失敗した日です。">
      {onPrev && (
        <button type="button" onClick={onPrev} className={outlineButton}>
          <Icon name="chevronLeft" className="size-5" />
          前日へ
        </button>
      )}
    </Message>
  );
}

export function EmptyFilter({ name, onReset }: { name: string; onReset: () => void }) {
  return (
    <Message title={`「${name}」の記事はありません`} body="この日は該当する記事がありません。">
      <button type="button" onClick={onReset} className={outlineButton}>
        すべて表示
      </button>
    </Message>
  );
}

export function LoadError({ onReload }: { onReload: () => void }) {
  return (
    <Message
      icon={<Icon name="error" className="mb-4 size-10 text-muted" />}
      title="読み込みに失敗しました"
      body="接続を確認して、再読み込みしてください。"
    >
      <button
        type="button"
        onClick={onReload}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-on-accent"
      >
        <Icon name="refresh" className="size-5" />
        再読み込み
      </button>
    </Message>
  );
}

/** キーワード外の記事の前の見出し */
export function OutsideHeading() {
  return (
    <div className="mb-3 mt-6 flex items-end gap-2">
      <Icon name="explore" className="mb-0.5 size-5 text-muted" />
      <div>
        <h2 className="text-base font-bold">キーワード外</h2>
        <p className="text-xs text-muted">キーワードに一致しない、反響上位の記事</p>
      </div>
    </div>
  );
}

/** 記事のカードの形をした灰色の枠 */
export function Skeleton() {
  return (
    <ul
      aria-label="読み込み中"
      className="mx-auto flex max-w-4xl animate-pulse flex-col gap-3 px-4 py-4"
    >
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="rounded-2xl border border-line/60 bg-surface/60 p-4">
          <div className="h-3 w-[35%] rounded-sm bg-line/60" />
          <div className="mt-3 h-5 w-[92%] rounded-sm bg-line/60" />
          <div className="mt-2 h-3 w-[67%] rounded-sm bg-line/60" />
          <div className="mt-4 h-3 rounded-sm bg-line/60" />
          <div className="mt-2 h-3 rounded-sm bg-line/60" />
          <div className="mt-2 h-3 w-1/2 rounded-sm bg-line/60" />
        </li>
      ))}
    </ul>
  );
}
