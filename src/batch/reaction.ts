import type { Level } from "../shared/articles.ts";

type Metrics = { score: number; comments: number };

/**
 * 記事の反響（1〜5）。直近30日の注目記事（history）と比べた、スコアとコメント数の偏差値の平均で分ける。
 * 35未満=1、35〜45=2、45〜55=3、55〜65=4、65以上=5。
 *
 * - 対数（log(1+値)）にしてから偏差値を出す。スコアは一部の記事だけが桁違いに大きく、
 *   そのままだと平均が引っぱられて、ほとんどの記事が2〜3になるため
 * - 標準偏差は、記録そのものが比べる相手のすべてなので、母集団の標準偏差を使う
 * - 記録が2件未満、またはばらつきが0のものは偏差値を出せないので、50（真ん中）として扱う
 * - history は、同じ記事が重ならないようにして渡す（直近の値だけ）
 */
export function computeReaction(item: Metrics, history: Metrics[]): Level {
  const t =
    (deviation(
      item.score,
      history.map((h) => h.score),
    ) +
      deviation(
        item.comments,
        history.map((h) => h.comments),
      )) /
    2;
  if (t < 35) return 1;
  if (t < 45) return 2;
  if (t < 55) return 3;
  if (t < 65) return 4;
  return 5;
}

function deviation(value: number, values: number[]): number {
  if (values.length < 2) return 50;
  const logs = values.map((v) => Math.log1p(v));
  const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
  const variance = logs.reduce((a, b) => a + (b - mean) ** 2, 0) / logs.length;
  const sd = Math.sqrt(variance);
  if (sd === 0) return 50;
  return 50 + (10 * (Math.log1p(value) - mean)) / sd;
}
