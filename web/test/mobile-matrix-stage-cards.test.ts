import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Block C (Mobile-Tab-Adapter) regression gate for the Matrix mobile stage
 * cards.
 *
 * Audit fix ("Matrix Mobile Hierarchy"):
 *   - Inside the Matrix mobile panel, 4 distinct stage cards must appear:
 *     identity, rooms, scope, topic.
 *   - Each card must use `.matrix-mobile-stage-card` and carry a
 *     `data-stage="identity|rooms|scope|topic"` attribute.
 *   - critical.css must declare at least one `.matrix-mobile-stage-card` rule
 *     and four `data-stage` selector variants.
 */

const criticalSource = () => readFileSync("web/src/critical.css", "utf8");
const matrixWorkspaceSource = () => readFileSync(
  "web/src/components/MatrixWorkspace.tsx",
  "utf8",
);

test("critical.css declares .app-shell-mobile .matrix-mobile-stage-card", () => {
  const css = criticalSource();
  const match = css.match(
    /\.app-shell-mobile\s+\.matrix-mobile-stage-card\s*\{([\s\S]*?)\}/,
  );
  assert.ok(
    match,
    "expected .app-shell-mobile .matrix-mobile-stage-card rule in critical.css",
  );
});

test("critical.css declares 4 distinct .matrix-mobile-stage-card variants keyed on data-stage", () => {
  const css = criticalSource();
  const variants = [
    /\.app-shell-mobile\s+\.matrix-mobile-stage-card\[data-stage="identity"\]\s*\{/,
    /\.app-shell-mobile\s+\.matrix-mobile-stage-card\[data-stage="rooms"\]\s*\{/,
    /\.app-shell-mobile\s+\.matrix-mobile-stage-card\[data-stage="scope"\]\s*\{/,
    /\.app-shell-mobile\s+\.matrix-mobile-stage-card\[data-stage="topic"\]\s*\{/,
  ];
  for (const variant of variants) {
    assert.match(
      css,
      variant,
      `expected ${variant.source} selector in critical.css`,
    );
  }
});

test("MatrixWorkspace mobile panel renders 4 stage cards with the correct data-stage values", () => {
  const source = matrixWorkspaceSource();
  for (const stage of ["identity", "rooms", "scope", "topic"]) {
    const re = new RegExp(
      `className="matrix-mobile-stage-card"[^>]*data-stage="${stage}"`,
    );
    assert.match(
      source,
      re,
      `MatrixWorkspace must render a <div className='matrix-mobile-stage-card' data-stage='${stage}'> inside the mobile panel`,
    );
  }
});

test("MatrixWorkspace mobile panel still uses the .matrix-mobile-panel wrapper", () => {
  const source = matrixWorkspaceSource();
  assert.match(
    source,
    /className="matrix-mobile-panel mobile-panel-scroll"/,
    "MatrixWorkspace must keep the .matrix-mobile-panel wrapper",
  );
});
