import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Block C (Mobile-Tab-Adapter) regression gate for the Workbench mobile stage
 * progress indicator.
 *
 * Audit fix (R10 follow-up: "Workbench Mobile Hierarchy"):
 *   - A 1-row progress strip with 4 dots (1/4, 2/4, 3/4, 4/4) must appear
 *     above the existing `.github-mobile-stage-actions` row.
 *   - The component must render `data-stage-progress="<n>"` on the container.
 *   - critical.css must declare `.app-shell-mobile .github-mobile-stage-progress`.
 */

const criticalSource = () => readFileSync("web/src/critical.css", "utf8");
const githubWorkspaceSource = () => readFileSync(
  "web/src/components/GitHubWorkspace.tsx",
  "utf8",
);

test("critical.css declares the .app-shell-mobile .github-mobile-stage-progress rule", () => {
  const css = criticalSource();
  const match = css.match(
    /\.app-shell-mobile\s+\.github-mobile-stage-progress\s*\{([\s\S]*?)\}/,
  );
  assert.ok(
    match,
    "expected .app-shell-mobile .github-mobile-stage-progress rule in critical.css",
  );

  // Must declare a 1-row grid or flex with at least 4 child slots.
  const layoutMatch = /display:\s*(grid|flex)/.test(match[1]);
  assert.ok(
    layoutMatch,
    ".github-mobile-stage-progress must declare display: grid or display: flex",
  );
});

test("critical.css .github-mobile-stage-progress declares 4 child dots / 4 grid tracks", () => {
  const css = criticalSource();
  const match = css.match(
    /\.app-shell-mobile\s+\.github-mobile-stage-progress\s*\{([\s\S]*?)\}/,
  );
  assert.ok(match, "expected .app-shell-mobile .github-mobile-stage-progress rule");

  // Accept either grid-template-columns: repeat(4, ...) or justify-content: space-between
  // with 4 child rules (.github-mobile-stage-progress-dot:nth-child(1..4)).
  const hasFourColumns = /grid-template-columns:\s*repeat\(\s*4\s*,\s*[^)]+\)/.test(match[1]);
  const hasFourDots = /\.app-shell-mobile\s+\.github-mobile-stage-progress\s+span:nth-child\(\s*[1-4]\s*\)/.test(css)
    || /\.github-mobile-stage-progress-dot:nth-child\(\s*[1-4]\s*\)/.test(css);

  assert.ok(
    hasFourColumns || hasFourDots,
    ".github-mobile-stage-progress must declare 4 columns or 4 child dots",
  );
});

test("GitHubWorkspace mobile panel renders a stage-progress element with data-stage-progress", () => {
  const source = githubWorkspaceSource();
  // Must be inside the .github-mobile-panel block (we accept any nesting depth).
  const mobilePanel = source.match(
    /className="github-mobile-panel[\s\S]*?(?=\n      <\/section>\n      <article|\n      <\/section>\s*<\/section>)/,
  );
  // The regex above is intentionally permissive — fall back to whole source.
  const region = mobilePanel ? mobilePanel[0] : source;
  assert.match(
    region,
    /className="github-mobile-stage-progress"/,
    "GitHubWorkspace must render <div className='github-mobile-stage-progress'> inside the mobile panel",
  );
  // The progress value is wired via a JSX expression bound to a `1 | 2 | 3 | 4`
  // typed local, not a string literal — accept either form.
  const hasDataAttr = /data-stage-progress=\{workbenchMobileStage\}/.test(region)
    || /data-stage-progress="[1-4]"/.test(region);
  assert.ok(
    hasDataAttr,
    "GitHubWorkspace must wire data-stage-progress on the progress container (JSX expression or string literal)",
  );
  // The local must be a `1 | 2 | 3 | 4` literal type to keep the gate deterministic.
  assert.match(
    source,
    /workbenchMobileStage\s*:\s*1\s*\|\s*2\s*\|\s*3\s*\|\s*4/,
    "GitHubWorkspace must declare workbenchMobileStage as a 1 | 2 | 3 | 4 literal type",
  );
});

test("GitHubWorkspace mobile panel still shows the 2-column .github-mobile-stage-actions grid", () => {
  const css = criticalSource();
  const match = css.match(
    /\.app-shell-mobile\s+\.github-mobile-stage-actions\s*\{([\s\S]*?)\}/,
  );
  assert.ok(match, "expected .app-shell-mobile .github-mobile-stage-actions rule");
  assert.match(
    match[1],
    /grid-template-columns:\s*repeat\(\s*2\s*,\s*minmax\(\s*0\s*,\s*1fr\s*\)\s*\)/,
    ".github-mobile-stage-actions must declare 2 equal tracks for Confirm / Approve / Reject rows",
  );
});
