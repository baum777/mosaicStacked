import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "../src/lib/localization.js";
import App from "../src/App.js";

/**
 * Block F (Performance & Bundle) regression gate for F4.
 *
 * F4: `App.tsx` has 4 separate `useMemo` calls (`currentRows`,
 *     `currentStatusTone`, `currentHelperText`, `currentStatusBadge`)
 *     that all share the same switch statement and dependency set.
 *     F4 coalesces them into a single `currentSurfaceState` memo so
 *     the shell does not redo the mode switch four times per render.
 *
 * F4 also wraps the 5 row-array constants (`chatRows`, `githubRows`,
 *     `matrixRows`, `performanceRows`, `settingsRows`) in `useMemo`
 *     so their identities are stable across renders when their
 *     dependencies do not change.
 *
 * F4 wraps `recordTelemetry` in `useCallback` so its identity is
 *     stable across renders.
 *
 * Strategy:
 *   1. Source-level: App.tsx declares a `currentSurfaceState` memo
 *      that returns the merged `{ rows, statusTone, helperText,
 *      statusBadge }` for the active mode.
 *   2. Source-level: the 5 row arrays are wrapped in `useMemo`.
 *   3. Source-level: `recordTelemetry` is wrapped in `useCallback`.
 *   4. Runtime smoke: App still renders to valid markup under both
 *      EN and DE locales after the refactor (no behavioral break).
 */

const appPath = "web/src/App.tsx";

function readApp() {
  return readFileSync(appPath, "utf8");
}

test("F4: App.tsx declares a single `currentSurfaceState` useMemo returning { rows, statusTone, helperText, statusBadge }", () => {
  const source = readApp();

  // Must declare a currentSurfaceState constant via useMemo (with or
  // without a TypeScript generic).
  const surfaceStateMatch = source.match(
    /const\s+currentSurfaceState\s*=\s*useMemo(?:\s*<[\s\S]*?>)?\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?return\s*\{([\s\S]*?)\}[\s\S]*?\}\s*,/,
  );
  assert.ok(surfaceStateMatch, "App.tsx must declare `const currentSurfaceState = useMemo(() => { … return { … }, …)`");
  const returnBody = surfaceStateMatch[1];
  for (const key of ["rows", "statusTone", "helperText", "statusBadge"]) {
    assert.match(
      returnBody,
      new RegExp(`\\b${key}\\s*:`),
      `currentSurfaceState return body must include "${key}:" key`,
    );
  }
});

test("F4: App.tsx wraps the 5 row arrays (chatRows, githubRows, matrixRows, performanceRows, settingsRows) in useMemo", () => {
  const source = readApp();

  for (const arrayName of [
    "chatRows",
    "githubRows",
    "matrixRows",
    "performanceRows",
    "settingsRows",
  ]) {
    assert.match(
      source,
      new RegExp(`const\\s+${arrayName}\\s*=\\s*useMemo\\b`),
      `App.tsx must declare \`const ${arrayName} = useMemo(...)\` so the array identity is stable across renders`,
    );
  }
});

test("F4: App.tsx wraps `recordTelemetry` in useCallback so its identity is stable", () => {
  const source = readApp();

  assert.match(
    source,
    /const\s+recordTelemetry\s*=\s*useCallback\s*\(/,
    "App.tsx must declare `const recordTelemetry = useCallback(...)`",
  );
});

test("F4: App.tsx render smoke — EN locale still produces a valid shell markup", () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      LocaleProvider,
      { initialLocale: "en" },
      React.createElement(App),
    ),
  );

  // The shell survives the refactor.
  assert.match(markup, /MosaicStacked Console/);
  assert.match(markup, /Workspaces/);
});

test("F4: App.tsx render smoke — DE locale still produces a valid shell markup", () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      LocaleProvider,
      { initialLocale: "de" },
      React.createElement(App),
    ),
  );

  assert.match(markup, /MosaicStacked Konsole/);
  assert.match(markup, /Arbeitsbereiche/);
});
