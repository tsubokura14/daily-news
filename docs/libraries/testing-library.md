# Testing Library

書いた時点のバージョン：`@testing-library/react` 16.3.3、`@testing-library/dom` 10.4.2、`@testing-library/jest-dom` 7.0.1

React の部品を描いて、人が見るのと同じ手がかり（役割、文言、ラベル）で要素を探して試すライブラリ。Vitest の `web` プロジェクトで使う。

## このプロジェクトで使っているところ

- `render` で部品を描き、`screen.getByRole` などで探す
- `@testing-library/jest-dom` で、`toBeInTheDocument`、`toHaveTextContent` などの確かめ方を足している（`src/web/test-setup.ts` で読む）
- テストごとに描いたものを片付ける（`src/web/test-setup.ts` の `cleanup`）

## 公式

- https://testing-library.com/docs/react-testing-library/intro
- 探し方の優先順：https://testing-library.com/docs/queries/about#priority
- jest-dom の確かめ方：https://github.com/testing-library/jest-dom
