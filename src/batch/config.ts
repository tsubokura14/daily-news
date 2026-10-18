// 毎朝の取得で変えられる値。ここだけを直せば変わる
export const config = {
  /** 一覧の件数 */
  listSize: 30,
  /** 一覧のうち、キーワードに関連する記事の割合 */
  relatedRatio: 0.8,
  /** この値未満のスコアの記事は、候補にしない */
  minScore: 50,
  /** 直近この日数の一覧に載せた記事は、載せない */
  excludeDays: 3,
  /** 反響の比べる相手にする日数 */
  reactionDays: 30,
  /** この値以上の関連度（かつキーワードが1つ以上一致）の記事を、キーワードに関連する記事とする */
  minRelevance: 3,
  /** この値以上の反響の記事だけが、キーワード外として載る */
  minOffKeywordReaction: 4,
  /** AI に送る本文の最大文字数 */
  maxBodyChars: 4000,
  /** 分類を1回で送る記事の数 */
  classifyBatchSize: 50,
  /** 要約の呼び出しの間隔（ミリ秒）。無料枠の1分あたりの回数に当たらないようにする */
  summarizeIntervalMs: 6000,
  /** 環境変数 GEMINI_MODEL がないときのモデル名 */
  defaultModel: "gemini-3.5-flash-lite",
} as const;
