import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

/**
 * Block B (Desktop-Shell & Tastatur-A11y) regression gate for the theme hook.
 *
 * Strategy: source-level assertions (per the audit's documented fallback).
 * The repo's existing test framework is `node:test` with `tsx` and no DOM
 * testing library. The hook is a `useEffect` side-effect, so behaviour is
 * best verified by reading the source and asserting the contract.
 *
 * We assert that:
 *   1. `web/src/hooks/useConsoleTheme.ts` exists and exports `useConsoleTheme`.
 *   2. The hook sets `data-theme="dark"` for `tokyo` and `darkula`.
 *   3. The hook switches the document out of dark mode for `muted-light`
 *      (clears `data-theme` or sets it to a non-dark value) and toggles
 *      `body.light-mode`.
 *   4. The hook updates the `<meta name="theme-color">` content to a
 *      dark hex for dark themes and a light hex for `muted-light`.
 *   5. The effect dependency list is `[consoleTheme]` and is SSR-safe
 *      (`typeof document` guard).
 *   6. `App.tsx` no longer references `useDarkOnlyTheme` and now calls
 *      `useConsoleTheme(consoleTheme)`.
 *   7. `index.html` exposes at most one `<meta name="theme-color">` so
 *      the hook's selector is unambiguous.
 */

const hookPath = "web/src/hooks/useConsoleTheme.ts";
const appPath = "web/src/App.tsx";
const htmlPath = "web/index.html";

function readHook() {
  return readFileSync(hookPath, "utf8");
}

test("useConsoleTheme hook file exists and exports the named hook", () => {
  assert.ok(existsSync(hookPath), `${hookPath} must exist`);

  const source = readHook();
  assert.match(
    source,
    /export\s+(?:function|const)\s+useConsoleTheme/,
    "useConsoleTheme must be exported from the new hook file",
  );
});

test("useConsoleTheme is SSR-safe and depends on the theme parameter", () => {
  const source = readHook();

  assert.match(
    source,
    /typeof\s+document\s*===\s*["']undefined["']/,
    "hook must guard with `typeof document === 'undefined'` to stay SSR-safe",
  );

  assert.match(
    source,
    /useEffect\s*\(\s*[\s\S]*?,\s*\[\s*\w+\s*\]\s*\)/,
    "effect dependency list must include the theme parameter so changes propagate",
  );
});

test("useConsoleTheme sets data-theme='dark' for tokyo and darkula", () => {
  const source = readHook();

  // Look for an explicit assignment of `dataset.theme = "dark"` (regardless
  // of whether the document is referenced directly or via a local variable).
  const darkAssignment = /\.dataset\.theme\s*=\s*["']dark["']/;
  assert.match(
    source,
    darkAssignment,
    "hook must set dataset.theme = 'dark' for dark themes",
  );

  // Confirm both 'tokyo' and 'darkula' are referenced inside the hook body
  // so the dark branch is reachable for both.
  assert.match(source, /["']tokyo["']/);
  assert.match(source, /["']darkula["']/);
});

test("useConsoleTheme switches off dark mode for muted-light and toggles body.light-mode", () => {
  const source = readHook();

  // Either delete the dataset key, set it to an empty string, or assign a
  // non-dark value when the theme is muted-light. Accept any explicit signal
  // that the dark attribute is removed.
  const clearsDarkRegex = /(delete\s+\w+\.dataset\.theme|\.dataset\.theme\s*=\s*["'](?:\s*|muted-light)["']|removeAttribute\s*\(\s*["']data-theme["']\s*\))/;
  assert.match(
    source,
    clearsDarkRegex,
    "hook must remove or override the dark data-theme attribute for muted-light",
  );

  // body.light-mode must be added for muted-light and removed for dark themes.
  assert.match(
    source,
    /\.classList\.add\(\s*["']light-mode["']\s*\)/,
    "hook must add body.light-mode for muted-light",
  );
  assert.match(
    source,
    /\.classList\.remove\(\s*["']light-mode["']\s*\)/,
    "hook must remove body.light-mode for dark themes",
  );
});

test("useConsoleTheme updates <meta name='theme-color'> for every theme", () => {
  const source = readHook();

  // Must select the meta tag and update its `content` attribute. Accept any
  // of the documented selector strategies, including a generic
  // `querySelector<HTMLMetaElement>(...)` call.
  const selectorRegex = /querySelector[<(][^>]*>?\s*\(\s*["']meta\[name=["']theme-color["']\][^"']*["']/;
  assert.match(
    source,
    selectorRegex,
    "hook must select <meta name='theme-color'> via querySelector",
  );

  assert.match(
    source,
    /\.setAttribute\(\s*["']content["']\s*,/,
    "hook must call setAttribute('content', …) to update the meta tag",
  );

  // Each documented theme color must be present in the source as a hex literal.
  // tokyo keeps the current dark hex; darkula is a slightly lighter dark; muted-light
  // is the documented light hex.
  assert.match(source, /#050c14/i, "tokyo theme color #050c14 must be defined");
  assert.match(source, /#1a1a1d/i, "darkula theme color #1a1a1d must be defined");
  assert.match(source, /#f7f8fb/i, "muted-light theme color #f7f8fb must be defined");
});

test("App.tsx imports useConsoleTheme and removes the legacy useDarkOnlyTheme", () => {
  const source = readFileSync(appPath, "utf8");

  assert.match(
    source,
    /import\s*\{[^}]*\buseConsoleTheme\b[^}]*\}\s*from\s*["']\.\/hooks\/useConsoleTheme\.js["']/,
    "App.tsx must import useConsoleTheme from the new hook file",
  );
  assert.match(
    source,
    /useConsoleTheme\s*\(\s*consoleTheme\s*\)/,
    "ConsoleShell must call useConsoleTheme(consoleTheme)",
  );
  assert.doesNotMatch(
    source,
    /useDarkOnlyTheme\s*\(/,
    "ConsoleShell must not call the legacy useDarkOnlyTheme",
  );
  assert.doesNotMatch(
    source,
    /function\s+useDarkOnlyTheme\s*\(/,
    "useDarkOnlyTheme definition must be removed from App.tsx",
  );
});

test("index.html exposes at most one <meta name='theme-color'> tag", () => {
  const html = readFileSync(htmlPath, "utf8");
  const matches = html.match(/<meta[^>]*name=["']theme-color["'][^>]*>/g) ?? [];

  assert.ok(
    matches.length <= 1,
    `expected at most one <meta name="theme-color"> in index.html, found ${matches.length}`,
  );
});
