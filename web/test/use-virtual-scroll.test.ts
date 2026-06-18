import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Block F (Performance & Bundle) regression gate for F3 — hook surface.
 *
 * F3: `useVirtualScroll` has 0 consumers. F3 wires it into the
 *     MatrixWorkspace `joinedRooms` list (gated at >30) and into
 *     `SessionList` (gated at >20).
 *
 * The 5 behavioural tests in this file are structural. Driving the
 *     full hook (setContainerHeight, setScrollTop, ResizeObserver,
 *     clientHeight, scroll events) requires a DOM. `node --test` does
 *     not bundle jsdom, so the full behavioural suite is BLOCKED on
 *     the `useVirtualScroll.test.ts` side; the call-site integration
 *     is covered by `virtual-scroll-applied.test.ts` and the
 *     `useVirtualScroll` source-level invariants are checked here.
 *
 * What this file checks (5 tests):
 *   1. The hook exists and is exported from `web/src/hooks/useVirtualScroll.ts`.
 *   2. Its return shape exposes `virtualItems`, `topSpacerHeight`,
 *      `bottomSpacerHeight`, `totalHeight`, `scrollToIndex`.
 *   3. The hook's `useMemo` offsets are recomputed on `bumpMeasureVersion`.
 *   4. The binary search `findFirstVisibleIndex` returns 0 when
 *      scrollTop = 0 (boundary case).
 *   5. `scrollToIndex` clamps the index into `[0, items.length]`.
 *
 * `findFirstVisibleIndex` and `clamp` are not exported, so tests 4
 *     and 5 are verified indirectly through the source code
 *     (behavioural validation belongs in a jsdom-driven suite that
 *     Block G can add when it onboards a DOM test runner).
 */

const hookPath = "web/src/hooks/useVirtualScroll.ts";

function readHook() {
  return readFileSync(hookPath, "utf8");
}

test("F3: useVirtualScroll hook is exported and the result type is documented", () => {
  const source = readHook();
  assert.match(
    source,
    /export\s+function\s+useVirtualScroll\b/,
    "useVirtualScroll must export the `useVirtualScroll` hook function",
  );
  assert.match(
    source,
    /type\s+UseVirtualScrollResult\b/,
    "useVirtualScroll must declare a `UseVirtualScrollResult` type",
  );
});

test("F3: useVirtualScroll return shape includes virtualItems, spacers, totalHeight, scrollToIndex", () => {
  const source = readHook();
  // Type literal check.
  assert.match(
    source,
    /virtualItems:\s*VirtualItem<TItem>\[\]/,
    "result must include `virtualItems: VirtualItem<TItem>[]`",
  );
  assert.match(
    source,
    /topSpacerHeight:\s*number/,
    "result must include `topSpacerHeight: number`",
  );
  assert.match(
    source,
    /bottomSpacerHeight:\s*number/,
    "result must include `bottomSpacerHeight: number`",
  );
  assert.match(
    source,
    /totalHeight:\s*number/,
    "result must include `totalHeight: number`",
  );
  assert.match(
    source,
    /scrollToIndex:\s*\(index:\s*number/,
    "result must include `scrollToIndex: (index: number, ...)`",
  );
});

test("F3: useVirtualScroll uses a useReducer-backed bumpMeasureVersion invalidator", () => {
  const source = readHook();
  // The cache invalidator should be a useReducer (preferred) or a
  // useState — anything that exposes an external "bump" function.
  // We check for the explicit `bumpMeasureVersion` variable name.
  assert.match(
    source,
    /\bbumpMeasureVersion\b/,
    "useVirtualScroll must expose a `bumpMeasureVersion` invalidator so the offsets cache is refreshed when child measurements change",
  );
  // And it must be a useState or useReducer setter (not a manual ref
  // mutation that escapes React's render loop).
  assert.match(
    source,
    /use(?:Reducer|State)[^=]*=\s*use(?:Reducer|State)\([^)]*\)/,
    "bumpMeasureVersion should be backed by useState/useReducer so React sees the invalidation",
  );
});

test("F3: useVirtualScroll binary-search boundary returns 0 when scrollTop = 0 (covered via source)", () => {
  // `findFirstVisibleIndex` is not exported, so we cannot drive it
  // directly without a DOM. We check the source contract instead:
  // the helper must clamp the lower bound to 0.
  const source = readHook();
  assert.match(
    source,
    /function\s+findFirstVisibleIndex\b[\s\S]*?Math\.max\(0,\s*low\s*-\s*1\)/,
    "findFirstVisibleIndex must clamp its lower bound to 0 (so scrollTop=0 yields the first item)",
  );
  // The helper is invoked from the render path with the current
  // scrollTop, so the boundary is part of the production path.
  assert.match(
    source,
    /findFirstVisibleIndex\(\s*offsets,\s*scrollTop\s*\)/,
    "the hook must call findFirstVisibleIndex(offsets, scrollTop) in the render path",
  );
});

test("F3: useVirtualScroll scrollToIndex clamps the target index to [0, items.length]", () => {
  // `clamp` is not exported, so we check the source contract.
  const source = readHook();
  assert.match(
    source,
    /function\s+clamp\b[\s\S]*?Math\.min\(max,\s*Math\.max\(min,\s*value\)\)/,
    "clamp must constrain `value` to the [min, max] range",
  );
  // scrollToIndex must call clamp(0, items.length) on the index.
  assert.match(
    source,
    /scrollToIndex[\s\S]*?clamp\(\s*index,\s*0,\s*options\.items\.length\s*\)/,
    "scrollToIndex must clamp `index` into [0, options.items.length] before reading offsets",
  );
});
