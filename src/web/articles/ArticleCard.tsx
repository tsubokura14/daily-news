import type { Article } from "../../shared/articles.ts";
import { Icon } from "../icons.tsx";
import { Scale } from "./Scale.tsx";
import { Summary } from "./Summary.tsx";

const POST_TYPE_LABEL = { show: "Show HN", ask: "Ask HN" } as const;

export function ArticleCard({ article }: { article: Article }) {
  const { ai, keyword, postType } = article;
  const link = (
    <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-link">
      {ai?.titleJa ?? article.titleEn}
    </a>
  );
  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-xs font-medium">
        <span className="size-2 rounded-full bg-source-hn" aria-hidden="true" />
        Hacker News
        {postType && (
          <span className="rounded-md border border-line px-1.5 text-muted">
            {POST_TYPE_LABEL[postType]}
          </span>
        )}
      </div>

      {keyword && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-0.5 font-bold text-link">{keyword.category}</span>
          {keyword.keywords.map((word) => (
            <span key={word} className="rounded-full bg-bg px-2.5 py-0.5 text-muted">
              {word}
            </span>
          ))}
        </div>
      )}
      {ai && !keyword && (
        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-ink px-2 py-0.5 text-xs font-bold">
          <Icon name="explore" className="size-4" />
          キーワード外
        </span>
      )}

      <h2 className="mt-2 font-serif text-lg font-medium leading-snug">{link}</h2>
      <p className="mt-2 text-xs leading-5 text-muted">
        {ai && `${article.titleEn}・`}
        {article.domain}
      </p>

      {ai && <Summary text={ai.summary} />}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 border-t border-line pt-2">
        {keyword && <Scale label="関連度" value={keyword.relevance} />}
        {ai && <Scale label="重要度" value={ai.importance} />}
        <Scale label="反響" value={article.reaction} />
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1 py-1 text-sm font-medium text-link"
        >
          {postType === "ask" ? "HN で開く" : "記事を開く"}
          <Icon name="arrowOutward" className="size-4" />
        </a>
      </div>
    </article>
  );
}
