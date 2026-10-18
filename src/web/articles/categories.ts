import keywords from "../../batch/keywords.json";

/**
 * 絞り込みのマス目に出すカテゴリ。登録の順。
 * 前提（崩れたら見直す）：キーワードがリポジトリのファイルにある間だけ、ここから読む。#4 でキーワードを DB に移したら、DB から読む
 */
export const CATEGORY_NAMES: string[] = keywords.categories.map((c) => c.name);
