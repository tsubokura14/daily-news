# React

書いた時点のバージョン：19.3.1

表示ページの画面を作るライブラリ。

## このプロジェクトで使っているところ

- `src/web/main.tsx` で `createRoot` から `App` を描く。`StrictMode` で包んでいる（開発中だけ、描画を2回して副作用の間違いを見つけやすくする）
- 画面は `src/web/` に置く

## 公式

- https://react.dev/learn
- API：https://react.dev/reference/react
