import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Block F (Performance & Bundle) regression gate for F3 — call sites.
 *
 * F3: `useVirtualScroll` had 0 consumers. F3 wires it into:
 *   - `MatrixWorkspace.tsx` (joined rooms list, gated at >30 rooms)
 *   - `SessionList.tsx` (sessions list, gated at >20 sessions)
 *
 * The gate length keeps the simple `.map` path for small lists so
 * visible behaviour is identical for the common case.
 *
 * Strategy: source-level assertions.
 *   1. MatrixWorkspace imports `useVirtualScroll` and uses it on the
 *      `joinedRooms` array.
 *   2. SessionList imports `useVirtualScroll` and uses it on its
 *      `sessions` array (after sorting).
 *
 * The behavioural contract of the hook itself is covered by
 * `use-virtual-scroll.test.ts`; the integration test guards the
 * call sites.
 */

const matrixWorkspacePath = "web/src/components/MatrixWorkspace.tsx";
const sessionListPath = "web/src/components/SessionList.tsx";
const hookPath = "web/src/hooks/useVirtualScroll.ts";

function readMatrixWorkspace() {
  return readFileSync(matrixWorkspacePath, "utf8");
}

function readSessionList() {
  return readFileSync(sessionListPath, "utf8");
}

function readHook() {
  return readFileSync(hookPath, "utf8");
}

test("F3: useVirtualScroll is consumed by MatrixWorkspace for the joined rooms list", () => {
  const source = readMatrixWorkspace();
  // Must import the hook.
  assert.match(
    source,
    /import\s*\{[^}]*useVirtualScroll[^}]*\}\s*from\s*["'][^"']*useVirtualScroll/,
    "MatrixWorkspace must import useVirtualScroll from web/src/hooks/useVirtualScroll",
  );
  // The hook should be called with the joined rooms list. The exact
  // shape is `items: shouldVirtualizeJoinedRooms ? joinedRooms : []`
  // or a plain `items: joinedRooms` / `items: visibleJoinedRooms`.
  assert.match(
    source,
    /useVirtualScroll\s*\(\s*\{[\s\S]{0,200}?(?:visibleJoinedRooms|joinedRooms)/,
    "MatrixWorkspace must call useVirtualScroll({ items: … joinedRooms …})",
  );
});

test("F3: useVirtualScroll is consumed by SessionList for the sessions list", () => {
  const source = readSessionList();
  // Must import the hook.
  assert.match(
    source,
    /import\s*\{[^}]*useVirtualScroll[^}]*\}\s*from\s*["'][^"']*useVirtualScroll/,
    "SessionList must import useVirtualScroll from web/src/hooks/useVirtualScroll",
  );
  // The hook should be called with the sorted sessions. The exact
  // shape is `items: shouldVirtualize ? sortedSessions : []` or a
  // plain `items: sortedSessions`.
  assert.match(
    source,
    /useVirtualScroll\s*\(\s*\{[\s\S]{0,200}?sortedSessions/,
    "SessionList must call useVirtualScroll({ items: … sortedSessions …})",
  );
});
