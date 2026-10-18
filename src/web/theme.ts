export type Theme = "light" | "dark";

// index.html の先頭の script も同じキーを読む。キーを変えるときは両方を直す
const STORAGE_KEY = "daily-news-theme";

const isTheme = (value: unknown): value is Theme => value === "light" || value === "dark";

function stored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

/** 覚えている選択。なければ OS の設定 */
export function currentTheme(): Theme {
  return (
    stored() ?? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}

/** 選んだ明暗を、その端末のブラウザに覚え、画面に反映する。色のトークンは light-dark() なので、color-scheme を変えるだけで切り替わる */
export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  document.documentElement.style.colorScheme = theme;
}
