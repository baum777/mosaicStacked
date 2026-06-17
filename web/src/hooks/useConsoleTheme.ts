import { useEffect } from "react";

export type ConsoleTheme = "tokyo" | "darkula" | "muted-light";

/**
 * Documented theme → `<meta name="theme-color">` color map.
 * Exported so tests and the static markup layer can share the same
 * authoritative hex values.
 */
export const CONSOLE_THEME_COLOR_MAP: Record<ConsoleTheme, string> = {
  tokyo: "#050c14",
  darkula: "#1a1a1d",
  "muted-light": "#f7f8fb",
};

const DARK_THEMES: ReadonlyArray<ConsoleTheme> = ["tokyo", "darkula"];

function isDarkTheme(theme: ConsoleTheme): boolean {
  return DARK_THEMES.includes(theme);
}

function findThemeColorMeta(): HTMLMetaElement | null {
  if (typeof document === "undefined") {
    return null;
  }

  // Prefer a single tag without a `media` attribute so the browser does
  // not pick one scheme over the other before our hook can update it.
  const untagged = document.head.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]:not([media])',
  );
  if (untagged) {
    return untagged;
  }

  // Fallback: pick the dark-scheme tag (most useful for current shell default).
  const dark = document.head.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"][media*="dark"]',
  );
  if (dark) {
    return dark;
  }

  // Final fallback: any theme-color tag.
  return document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
}

/**
 * Apply the active console theme to the document.
 *
 * Replaces the legacy `useDarkOnlyTheme` hook which unconditionally forced
 * the dark scheme and made the documented `muted-light` console theme
 * unreachable on mobile. The hook is SSR-safe and runs the side effects in
 * a `useEffect` so server rendering does not touch the DOM.
 */
export function useConsoleTheme(theme: ConsoleTheme): void {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const body = document.body;

    if (isDarkTheme(theme)) {
      root.dataset.theme = "dark";
      body.classList.remove("light-mode");
    } else {
      // muted-light: drop the dark scheme marker and opt the body into the
      // existing light-mode token set so legacy rules keep matching.
      delete root.dataset.theme;
      body.classList.add("light-mode");
    }

    const meta = findThemeColorMeta();
    if (meta) {
      meta.setAttribute("content", CONSOLE_THEME_COLOR_MAP[theme]);
    }
  }, [theme]);
}
