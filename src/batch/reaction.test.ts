import { describe, expect, it } from "vitest";
import { computeReaction } from "./reaction.ts";

// log(1+x) が L になる値。スコアとコメント数の両方に同じ値を入れて、偏差値を決めやすくする
const at = (l: number) => ({ score: Math.expm1(l), comments: Math.expm1(l) });

describe("computeReaction", () => {
  // log が 0 と 2 の2件 → 平均 1、標準偏差 1。log が L の記事の偏差値は 50 + 10 × (L − 1)
  const history = [at(0), at(2)];

  it("偏差値の区切り（45、65）の両側で段階が変わる", () => {
    expect(computeReaction(at(0.49), history)).toBe(2);
    expect(computeReaction(at(0.51), history)).toBe(3);
    expect(computeReaction(at(2.49), history)).toBe(4);
    expect(computeReaction(at(2.51), history)).toBe(5);
  });

  it("偏差値が35未満なら1", () => {
    // 平均 9、標準偏差 3 の記録で、log が 0 の記事は偏差値 20
    const wide = [...Array.from({ length: 9 }, () => at(10)), at(0)];
    expect(computeReaction(at(0), wide)).toBe(1);
  });

  it("スコアとコメント数の偏差値の平均で決める", () => {
    // スコアは偏差値 40（2）、コメント数は偏差値 60（4）→ 平均 50 で 3
    const item = { score: Math.expm1(0), comments: Math.expm1(2) };
    expect(computeReaction(item, history)).toBe(3);
  });

  it("記録が2件未満なら、比べられないので3", () => {
    expect(computeReaction(at(5), [])).toBe(3);
    expect(computeReaction(at(5), [at(1)])).toBe(3);
  });

  it("記録がすべて同じ値（ばらつきが0）なら3", () => {
    expect(computeReaction(at(5), [at(1), at(1), at(1)])).toBe(3);
  });
});
