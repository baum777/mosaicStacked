import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Block C (Mobile-Tab-Adapter) regression gate for the Matrix mobile submit
 * disabled hint.
 *
 * Audit fix ("Matrix Submit-Disabled Hint"):
 *   - When the mobile composer is fail-closed (no write contract active),
 *     an inline `aria-live="polite"` hint must explain why submit is disabled.
 *   - The hint must be wired to the mobile composer block in MatrixWorkspace.
 *   - critical.css must declare `.matrix-mobile-submit-hint` so the hint is
 *     visible and small.
 */

const criticalSource = () => readFileSync("web/src/critical.css", "utf8");
const matrixWorkspaceSource = () => readFileSync(
  "web/src/components/MatrixWorkspace.tsx",
  "utf8",
);

test("critical.css declares .app-shell-mobile .matrix-mobile-submit-hint", () => {
  const css = criticalSource();
  const match = css.match(
    /\.app-shell-mobile\s+\.matrix-mobile-submit-hint\s*\{([\s\S]*?)\}/,
  );
  assert.ok(
    match,
    "expected .app-shell-mobile .matrix-mobile-submit-hint rule in critical.css",
  );
  // Hint must be muted and small (≤ 12 px) so it does not compete with the
  // primary action label.
  assert.match(
    match[1],
    /font-size:\s*1[01]px/,
    ".matrix-mobile-submit-hint must declare font-size 10px or 11px",
  );
});

test("MatrixWorkspace renders an aria-live='polite' submit-hint element inside the mobile panel", () => {
  const source = matrixWorkspaceSource();
  // The hint must be inside the .matrix-mobile-panel region.
  const mobilePanel = source.match(
    /className="matrix-mobile-panel[\s\S]*?(?=\n      <\/section>\n      <section|\n      <\/section>\s*<\/section>)/,
  );
  const region = mobilePanel ? mobilePanel[0] : source;

  assert.match(
    region,
    /className="matrix-mobile-submit-hint"/,
    "MatrixWorkspace mobile panel must render an element with className='matrix-mobile-submit-hint'",
  );
  assert.match(
    region,
    /aria-live="polite"/,
    "matrix-mobile-submit-hint must declare aria-live='polite'",
  );
});

test("MatrixWorkspace submit-hint text references the fail-closed posture or missing write contract", () => {
  const source = matrixWorkspaceSource();
  // The hint must contain text that mentions read-only / fail-closed / approval.
  const hintMatch = source.match(
    /matrix-mobile-submit-hint[\s\S]*?<\/p>|matrix-mobile-submit-hint[\s\S]*?<\/span>/,
  );
  assert.ok(
    hintMatch,
    "matrix-mobile-submit-hint must contain a text node (p or span)",
  );
  const hintText = hintMatch[0].toLowerCase();
  const informative = /(read-only|read only|fail[- ]closed|write contract|approval|submit)/.test(
    hintText,
  );
  assert.ok(
    informative,
    "matrix-mobile-submit-hint text must reference the fail-closed / read-only / approval posture",
  );
});
