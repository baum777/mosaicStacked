import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Block D (Performance-Tab & Bundle) regression gate for R6 and R15.
 *
 * R6: SettingsWorkspace must be lazy-loaded through `React.lazy(...)` in
 *     `web/src/App.tsx` instead of imported eagerly at the top of the file.
 *     The other 4 workspaces already use this pattern; Settings must join
 *     them.
 *
 * R15: The deferred-preload whitelist in `web/vite.config.ts` must include
 *      the `"SettingsWorkspace"` chunk prefix so the lazy Settings chunk is
 *      NOT preloaded. The chunk name in dist is `SettingsWorkspace-…js`
 *      (matching the existing `ChatWorkspace-…js` / `PerformanceWorkspace-…js`
 *      pattern). `SettingsPage` and `chunk-settings` are not valid chunk
 *      names and must not be added.
 *
 * Strategy: source-level assertions. The lazy conversion and the chunk
 * whitelist are best verified by reading the source; behaviour in the
 * browser is already covered by the integration suite.
 */

const appPath = "web/src/App.tsx";
const vitePath = "web/vite.config.ts";

function readApp() {
  return readFileSync(appPath, "utf8");
}

function readVite() {
  return readFileSync(vitePath, "utf8");
}

test("R6: App.tsx no longer imports SettingsWorkspace as a value at the top level", () => {
  const source = readApp();
  const topLevelImports = source
    .split("\n")
    .filter((line) => line.startsWith("import "));

  assert.ok(
    topLevelImports.every((line) => !line.includes("./components/SettingsWorkspace")),
    "SettingsWorkspace must be loaded via React.lazy, not a top-level import",
  );

  // Type-only imports are erased at compile time and remain acceptable.
  // We only block value imports of `./components/SettingsWorkspace`.
  for (const line of topLevelImports) {
    if (line.includes("./components/SettingsWorkspace")) {
      assert.match(
        line,
        /\btype\b/,
        `top-level import of SettingsWorkspace must be type-only: ${line}`,
      );
    }
  }
});

test("R6: App.tsx declares a loadSettingsWorkspace dynamic loader for SettingsWorkspace.js", () => {
  const source = readApp();

  assert.match(
    source,
    /loadSettingsWorkspace\s*=\s*\(\s*\)\s*=>\s*import\(\s*["']\.\/components\/SettingsWorkspace\.js["']\s*\)/,
    "App.tsx must define `loadSettingsWorkspace = () => import(\"./components/SettingsWorkspace.js\")` to match the other 4 lazy workspaces",
  );
});

test("R6: App.tsx wraps SettingsWorkspace in React.lazy with the .then((module) => ({ default: module.SettingsWorkspace })) shape", () => {
  const source = readApp();

  assert.match(
    source,
    /const\s+SettingsWorkspace\s*=\s*lazy\s*\(\s*\(\s*\)\s*=>\s*loadSettingsWorkspace\s*\(\s*\)\s*\.then\s*\(\s*\(\s*module\s*\)\s*=>\s*\(\s*\{\s*default:\s*module\.SettingsWorkspace\s*\}\s*\)\s*\)\s*\)/,
    "App.tsx must wrap SettingsWorkspace in React.lazy using the established .then((module) => ({ default: module.SettingsWorkspace })) shape",
  );
});

test("R6: App.tsx still renders <SettingsWorkspace {...settingsWorkspaceProps} /> at the call site", () => {
  const source = readApp();

  assert.match(
    source,
    /<SettingsWorkspace\s*\{\.\.\.settingsWorkspaceProps\}\s*\/>/,
    "App.tsx must keep the existing <SettingsWorkspace {...settingsWorkspaceProps} /> call site after the lazy conversion",
  );
});

test("R15: vite.config.ts DEFERRED_PRELOAD_CHUNK_PREFIXES includes the SettingsWorkspace chunk prefix", () => {
  const source = readVite();

  // Whitelist is still an array of strings (regression guard).
  assert.match(
    source,
    /const\s+DEFERRED_PRELOAD_CHUNK_PREFIXES\s*=\s*\[[\s\S]*?\]/,
    "vite.config.ts must still define DEFERRED_PRELOAD_CHUNK_PREFIXES as an array literal",
  );

  // Must include "SettingsWorkspace" — the operative prefix matching the
  // real chunk name `SettingsWorkspace-…js`.
  assert.match(
    source,
    /DEFERRED_PRELOAD_CHUNK_PREFIXES[\s\S]*?["']SettingsWorkspace["']/,
    "DEFERRED_PRELOAD_CHUNK_PREFIXES must include \"SettingsWorkspace\" so the new lazy chunk is deferred from preload",
  );
});

test("R15: vite.config.ts does not add a non-existent SettingsPage or chunk-settings prefix", () => {
  const source = readVite();

  // Extract just the array contents to avoid matching code outside the
  // whitelist that happens to contain the same string.
  const match = source.match(/DEFERRED_PRELOAD_CHUNK_PREFIXES\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(match, "expected to find DEFERRED_PRELOAD_CHUNK_PREFIXES array");
  const arrayBody = match[1];

  assert.doesNotMatch(
    arrayBody,
    /["']SettingsPage["']/,
    "DEFERRED_PRELOAD_CHUNK_PREFIXES must not include \"SettingsPage\" — no such chunk exists",
  );
  assert.doesNotMatch(
    arrayBody,
    /["']chunk-settings["']/,
    "DEFERRED_PRELOAD_CHUNK_PREFIXES must not include \"chunk-settings\" — no such chunk exists",
  );
});

test("R15: the four operative prefixes GitHubPage, MatrixPage, chunk-github, chunk-matrix are still whitelisted", () => {
  const source = readVite();
  const match = source.match(/DEFERRED_PRELOAD_CHUNK_PREFIXES\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(match, "expected to find DEFERRED_PRELOAD_CHUNK_PREFIXES array");
  const arrayBody = match[1];

  for (const expected of ["GitHubPage", "MatrixPage", "chunk-github", "chunk-matrix"]) {
    assert.match(
      arrayBody,
      new RegExp(`["']${expected}["']`),
      `DEFERRED_PRELOAD_CHUNK_PREFIXES must still include \"${expected}\" (regression guard)`,
    );
  }
});
