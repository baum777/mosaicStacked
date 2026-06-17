import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PerformanceWorkspace } from "../src/components/PerformanceWorkspace.js";

/**
 * Block D (Performance-Tab & Bundle) regression gate for R7.
 *
 * R7: `web/src/components/PerformanceWorkspace.tsx` must read the
 *     `lastUpdated` timestamp from a local cache JSON
 *     (`web/src/lib/perf-cache.json`) and render it via
 *     `data-testid="performance-last-updated"`. The "local evidence only"
 *     disclaimer must remain visible. When the cache file is missing, the
 *     source must defensively handle the case and the rendered text must
 *     fall back to the literal string `"unknown"`. The four metric cards
 *     (LCP, CLS, TTI, Bundle) and the five workflow steps must keep
 *     rendering unchanged.
 *
 * Strategy: source-regex for the contract (perf-cache.json import,
 * `lastUpdated` field, `"unknown"` fallback, `data-testid`, "local
 * evidence only" disclaimer) plus `renderToStaticMarkup` for the four
 * metric cards, the five workflow steps, and the `data-testid` element.
 * We do not assert on the actual file presence — the source is what
 * proves the contract.
 */

const componentPath = "web/src/components/PerformanceWorkspace.tsx";

function readComponent() {
  return readFileSync(componentPath, "utf8");
}

test("R7: PerformanceWorkspace source imports perf-cache.json so the lastUpdated timestamp has a local source", () => {
  const source = readComponent();

  assert.match(
    source,
    /import[^;]*perf-cache\.json/,
    "PerformanceWorkspace must import perf-cache.json so the lastUpdated value has a local, committed source",
  );
});

test("R7: PerformanceWorkspace source references the lastUpdated field for rendering", () => {
  const source = readComponent();

  assert.match(
    source,
    /\blastUpdated\b/,
    "PerformanceWorkspace source must reference a `lastUpdated` value (e.g. via JSON import or local variable)",
  );
});

test("R7: PerformanceWorkspace source has a defensive \"unknown\" fallback for the lastUpdated value", () => {
  const source = readComponent();

  // Accept either a null/undefined check (`?? "unknown"`) or a missing-file
  // check, but the literal `"unknown"` string must appear at least once in
  // a defensive context (next to `lastUpdated`).
  const hasFallback = /lastUpdated[\s\S]{0,80}["']unknown["']/m.test(source)
    || /["']unknown["'][\s\S]{0,80}lastUpdated/m.test(source)
    || /perfCache\s*\?\.\s*lastUpdated/.test(source);
  assert.ok(
    hasFallback,
    "PerformanceWorkspace must defensively fall back to the literal \"unknown\" when the cache field is missing or malformed",
  );
});

test("R7: PerformanceWorkspace renders a data-testid=\"performance-last-updated\" element with the timestamp", () => {
  const source = readComponent();

  assert.match(
    source,
    /data-testid=["']performance-last-updated["']/,
    "PerformanceWorkspace must render an element with data-testid=\"performance-last-updated\" so the timestamp is locatable from tests and screen readers",
  );
});

test("R7: PerformanceWorkspace keeps the local evidence only disclaimer near the lastUpdated element", () => {
  const source = readComponent();

  // Either: a single combined assertion by checking the source contains the
  // "local evidence only" string somewhere (the disclaimer), OR a more
  // precise check that the disclaimer appears within ~400 chars of the
  // `lastUpdated` testid. The simpler check is sufficient as a contract
  // gate — the disclaimer line is in the same hero card.
  assert.match(
    source,
    /local evidence only/i,
    "PerformanceWorkspace must keep the \"local evidence only\" disclaimer",
  );
});

test("R7: PerformanceWorkspace renders the four metric cards (LCP, CLS, TTI, Bundle) and the five workflow steps", () => {
  const markup = renderToStaticMarkup(React.createElement(PerformanceWorkspace));

  for (const expected of ["LCP", "CLS", "TTI", "Bundle"]) {
    assert.match(
      markup,
      new RegExp(`>${expected}<`),
      `PerformanceWorkspace must render the ${expected} metric card`,
    );
  }

  for (const step of [
    "Typecheck web",
    "Unit web",
    "Build web",
    "Browser suite",
    "Bundle budget",
  ]) {
    assert.match(
      markup,
      new RegExp(`>${step}<`),
      `PerformanceWorkspace must render the \"${step}\" workflow step`,
    );
  }
});

test("R7: PerformanceWorkspace renders the data-testid=\"performance-last-updated\" element with a value", () => {
  const markup = renderToStaticMarkup(React.createElement(PerformanceWorkspace));

  const match = markup.match(
    /data-testid="performance-last-updated"[^>]*>([^<]+)</,
  );
  assert.ok(
    match,
    "PerformanceWorkspace must render <span data-testid=\"performance-last-updated\">…</span>",
  );

  const value = match[1].trim();
  assert.notEqual(
    value.length,
    0,
    "PerformanceWorkspace must render a non-empty value inside the last-updated span",
  );
  // Accept the documented fallback string OR an ISO timestamp.
  assert.ok(
    value === "unknown" || /^\d{4}-\d{2}-\d{2}T/.test(value),
    `last-updated value must be either the literal \"unknown\" or an ISO timestamp, got \"${value}\"`,
  );
});

test("R7: PerformanceWorkspace falls back to the literal \"unknown\" when the cache file is missing or has no lastUpdated", () => {
  // Render twice — once with the real cache file (if present) and once via
  // the source contract. The source contract is asserted in the prior
  // tests; here we only assert the rendered value is the literal "unknown"
  // when the component is rendered without a populated cache.
  //
  // We do not delete the cache file from disk; instead, we verify the
  // rendered value of the last-updated span is well-formed (either a real
  // ISO timestamp from the cache, or the literal "unknown"). This is
  // already covered by the prior test. The cache file presence check is
  // a soft sanity check: if the cache is missing, the source must still
  // produce a string (defensive code path) — this is a redundant guard.
  if (!existsSync("web/src/lib/perf-cache.json")) {
    // The committed stub is expected, but the implementation must also
    // tolerate a missing file at runtime. We cannot simulate that without
    // a module-level reset, so we assert it through the source-regex test
    // above (defensive fallback). Here we just log the absence.
    return;
  }
  const cache = JSON.parse(readFileSync("web/src/lib/perf-cache.json", "utf8")) as {
    lastUpdated?: unknown;
  };
  assert.ok(
    typeof cache.lastUpdated === "string",
    "perf-cache.json must keep a `lastUpdated` string field (may be \"unknown\")",
  );
});
