import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Block E (Authority & Polish) regression gate for the deferred-preload
 * whitelist cleanup.
 *
 * The whitelist in `web/vite.config.ts` previously included two
 * no-op prefix entries (`"vendor-syntax"` and `"vendor-ui"`) that did
 * not match any real chunk. Block E removes them so the list only
 * carries operative prefixes. This test guards:
 *
 *   1. The two no-op entries are gone.
 *   2. The four operative prefixes (`GitHubPage`, `MatrixPage`,
 *      `chunk-github`, `chunk-matrix`) plus `SettingsWorkspace` (added
 *      in Block D) remain in the list.
 *   3. The whitelist is still an array literal (regression guard
 *      against future refactors that might replace the literal with a
 *      derived expression).
 *
 * Strategy: source-level assertions. The whitelist semantics are best
 * verified by reading the source; behaviour in the browser is already
 * covered by the integration suite.
 */

const vitePath = "web/vite.config.ts";

function readVite() {
  return readFileSync(vitePath, "utf8");
}

function extractArrayBody(source: string) {
  const match = source.match(/DEFERRED_PRELOAD_CHUNK_PREFIXES\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(match, "expected to find DEFERRED_PRELOAD_CHUNK_PREFIXES array literal in vite.config.ts");
  return match[1];
}

test("DEFERRED_PRELOAD_CHUNK_PREFIXES no longer contains the no-op vendor-syntax prefix", () => {
  const arrayBody = extractArrayBody(readVite());

  assert.doesNotMatch(
    arrayBody,
    /["']vendor-syntax["']/,
    "DEFERRED_PRELOAD_CHUNK_PREFIXES must not contain \"vendor-syntax\" — no such chunk exists",
  );
});

test("DEFERRED_PRELOAD_CHUNK_PREFIXES no longer contains the no-op vendor-ui prefix", () => {
  const arrayBody = extractArrayBody(readVite());

  assert.doesNotMatch(
    arrayBody,
    /["']vendor-ui["']/,
    "DEFERRED_PRELOAD_CHUNK_PREFIXES must not contain \"vendor-ui\" — no such chunk exists",
  );
});

test("DEFERRED_PRELOAD_CHUNK_PREFIXES still carries the four operative page/chunk prefixes plus SettingsWorkspace", () => {
  const arrayBody = extractArrayBody(readVite());

  for (const expected of [
    "GitHubPage",
    "MatrixPage",
    "chunk-github",
    "chunk-matrix",
    "SettingsWorkspace",
  ]) {
    assert.match(
      arrayBody,
      new RegExp(`["']${expected}["']`),
      `DEFERRED_PRELOAD_CHUNK_PREFIXES must still include \"${expected}\" (regression guard)`,
    );
  }
});
