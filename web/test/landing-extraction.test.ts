import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Block F (Performance & Bundle) regression gate for F5.
 *
 * F5: `App.tsx` is 2990 lines. About 350 of those are landing-page
 *     constants (`LANDING_COPY`, `LANDING_FEATURES`, `LANDING_MODEL_STEPS`,
 *     `LANDING_ACTION_BUTTONS`, `LANDING_ACTION_RECIPES`,
 *     `LANDING_BEGINNER_FLOW`, `LANDING_POWER_RECIPES`), 60 are
 *     `LandingEntryGate`, 43 are `useLandingEntryGate`, 165 are
 *     `LandingPage`, 22 are `PublicPreview`, and 28 are
 *     `ReadmeLandingPage`. F5 moves them into `web/src/landing/`
 *     so the App shell only carries the routing and orchestration
 *     logic.
 *
 * The lazy boundary is preserved — `App.tsx` continues to render
 * `<LandingPage />` and `<LandingEntryGate />` via `React.lazy`, and
 * the `LandingPage` chunk is added to the deferred-preload
 *     whitelist in `web/vite.config.ts` so it does not get
 *     preloaded.
 *
 * Strategy: source-level assertions.
 *   1. `App.tsx` no longer contains the literal `const LANDING_COPY = {`
 *      declaration.
 *   2. A new file `web/src/landing/LandingPage.tsx` (or
 *      `web/src/components/LandingPage.tsx`) exists and exports
 *      `LandingPage`, `LandingEntryGate`, `useLandingEntryGate`,
 *      `ReadmeLandingPage`, `PublicPreview`.
 *   3. `web/src/landing/landing-copy.ts` (or similar) exists and
 *      carries the moved `LANDING_*` const declarations.
 *   4. The `LandingPage` chunk prefix is in
 *      `DEFERRED_PRELOAD_CHUNK_PREFIXES`.
 *   5. `App.tsx` still routes to `<LandingPage />` /
 *      `<LandingEntryGate />` (so the preview surface still works).
 */

const appPath = "web/src/App.tsx";
const vitePath = "web/vite.config.ts";
const landingPagePath = "web/src/landing/LandingPage.tsx";
const landingCopyPath = "web/src/landing/landing-copy.ts";

function readApp() {
  return readFileSync(appPath, "utf8");
}

function readVite() {
  return readFileSync(vitePath, "utf8");
}

function readLandingPage() {
  return readFileSync(landingPagePath, "utf8");
}

function readLandingCopy() {
  return readFileSync(landingCopyPath, "utf8");
}

test("F5: App.tsx no longer declares the literal `const LANDING_COPY = {` block", () => {
  const source = readApp();
  assert.doesNotMatch(
    source,
    /const\s+LANDING_COPY\s*=\s*\{/,
    "App.tsx must not declare `LANDING_COPY` directly — it moved to web/src/landing/landing-copy.ts",
  );
});

test("F5: web/src/landing/LandingPage.tsx exists and exports the 5 landing surfaces", () => {
  const source = readLandingPage();

  for (const exportName of [
    "LandingPage",
    "LandingEntryGate",
    "useLandingEntryGate",
    "ReadmeLandingPage",
    "PublicPreview",
  ]) {
    assert.match(
      source,
      new RegExp(`export\\s+(?:function|const)\\s+${exportName}\\b`),
      `web/src/landing/LandingPage.tsx must export "${exportName}"`,
    );
  }
});

test("F5: web/src/landing/landing-copy.ts exists and carries the LANDING_* const declarations", () => {
  const source = readLandingCopy();

  for (const constantName of [
    "LANDING_COPY",
    "LANDING_FEATURES",
    "LANDING_MODEL_STEPS",
    "LANDING_ACTION_BUTTONS",
    "LANDING_ACTION_RECIPES",
    "LANDING_BEGINNER_FLOW",
    "LANDING_POWER_RECIPES",
  ]) {
    assert.match(
      source,
      new RegExp(`(?:const|export const)\\s+${constantName}\\b`),
      `web/src/landing/landing-copy.ts must carry the "${constantName}" declaration`,
    );
  }
});

test("F5: vite.config.ts DEFERRED_PRELOAD_CHUNK_PREFIXES contains the LandingPage chunk prefix", () => {
  const source = readVite();
  const match = source.match(/DEFERRED_PRELOAD_CHUNK_PREFIXES\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(match, "expected to find DEFERRED_PRELOAD_CHUNK_PREFIXES array literal in vite.config.ts");
  const arrayBody = match[1];
  assert.match(
    arrayBody,
    /["']LandingPage["']/,
    "DEFERRED_PRELOAD_CHUNK_PREFIXES must include \"LandingPage\" so the new lazy chunk is deferred from preload",
  );
});

test("F5: App.tsx still routes to the landing surfaces (PublicPreview / ReadmeLandingPage)", () => {
  const source = readApp();
  // The surface router must still mention the landing components.
  // Block F5 added the lazy boundary: App.tsx uses dynamic
  // `import("./landing/LandingPage.js")` rather than a static
  // named import, so the test accepts either shape.
  const hasStaticImport = /import\s*\{[^}]*(?:ReadmeLandingPage|PublicPreview|LandingPage|LandingEntryGate|useLandingEntryGate)[^}]*\}\s*from\s*["'][^"']*landing/.test(source);
  const hasDynamicLazy = /import\s*\(\s*["'][^"']*landing\/LandingPage\.js["']\s*\)/.test(source);
  assert.ok(
    hasStaticImport || hasDynamicLazy,
    "App.tsx must import at least one of the landing surfaces from web/src/landing/ (static or dynamic)",
  );
  // The router must still dispatch to the readme / preview surfaces.
  assert.match(
    source,
    /<LandingReadmePage|<LazyLandingReadmePage|<LandingPublicPreview|<LazyLandingPublicPreview/,
    "App.tsx must render the readme or preview landing component",
  );
});
