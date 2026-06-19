import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DesktopSidebarTabs } from "../src/components/navigation/DesktopSidebarTabs.js";

/**
 * Block B (Desktop-Shell & Tastatur-A11y) regression gate.
 *
 * The desktop sidebar tabs are the primary keyboard-navigable surface for
 * switching between workspaces. Keyboard-only users cannot rely on hover
 * previews, so the labels must be visible — not `sr-only`-only — and the
 * active tab must still carry `aria-current="page"`.
 *
 * The component must:
 *   - Render one `<button class="workspace-tab-vertical">` per mode.
 *   - Render a visible `<span class="sidebar-tab-label">` with the label
 *     (not inside `.sr-only`).
 *   - Mark the active tab with `aria-current="page"`.
 *   - Keep `aria-label` on each button for screen-reader fallback.
 */

const workspaceLabels = {
  chat: "Chat",
  workbench: "Workbench",
  review: "Review Queue",
  community: "Community",
  models: "Models & Providers",
  evidence: "Evidence Log",
  matrix: "Matrix",
  settings: "Settings",
  perf: "Performance",
};

const sidebarSource = () => readFileSync(
  "web/src/components/navigation/DesktopSidebarTabs.tsx",
  "utf8",
);

function renderSidebar(active: keyof typeof workspaceLabels, workMode: "beginner" | "expert" = "expert") {
  return renderToStaticMarkup(
    React.createElement(DesktopSidebarTabs, {
      active,
      labels: workspaceLabels,
      ariaLabel: "Workspaces",
      onSelect: () => undefined,
      workMode,
    }),
  );
}

function htmlEscape(value: string) {
  return value.replaceAll("&", "&amp;");
}

test("DesktopSidebarTabs renders one button per workspace with class workspace-tab-vertical", () => {
  const markup = renderSidebar("chat");

  const matches = markup.match(/<button[^>]*class="[^"]*workspace-tab-vertical[^"]*"/g) ?? [];
  assert.equal(
    matches.length,
    Object.keys(workspaceLabels).length,
    `expected ${Object.keys(workspaceLabels).length} buttons with workspace-tab-vertical, got ${matches.length}`,
  );
});

test("DesktopSidebarTabs renders a visible label span for every tab (not sr-only only)", () => {
  const markup = renderSidebar("workbench");

  for (const label of Object.values(workspaceLabels)) {
    const renderedLabel = htmlEscape(label);
    assert.match(
      markup,
      new RegExp(`<span[^>]*class="[^"]*sidebar-tab-label[^"]*"[^>]*>${renderedLabel}</span>`),
      `expected a visible <span class="sidebar-tab-label">${label}</span> for every tab`,
    );
  }

  // No tab label should be inside a `sr-only` span.
  const srOnlySpans = markup.match(/<span[^>]*class="[^"]*sr-only[^"]*"[^>]*>[^<]*<\/span>/g) ?? [];
  for (const span of srOnlySpans) {
    for (const label of Object.values(workspaceLabels)) {
      assert.doesNotMatch(
        span,
        new RegExp(`>${label}</span>`),
        `label '${label}' must not be hidden via sr-only`,
      );
    }
  }
});

test("DesktopSidebarTabs marks the active tab with aria-current='page' and an active class", () => {
  const markup = renderSidebar("matrix");

  const activeRegex = /<button[^>]*aria-current="page"[^>]*>/;
  const match = markup.match(activeRegex);
  assert.ok(match, "expected a <button> with aria-current='page' for the active tab");

  const activeTag = match[0];
  assert.match(
    activeTag,
    /class="[^"]*workspace-tab-active/,
    "active tab must carry the workspace-tab-active class",
  );
  assert.match(
    activeTag,
    new RegExp(`data-testid="tab-matrix"`),
    "active tab must carry the tab-matrix data-testid",
  );
});

test("DesktopSidebarTabs keeps aria-label and title on every tab for screen-reader fallback", () => {
  const markup = renderSidebar("settings");

  for (const [mode, label] of Object.entries(workspaceLabels)) {
    const tabRegex = new RegExp(
      `<button[^>]*data-testid="tab-${mode}"[^>]*>`,
    );
    const match = markup.match(tabRegex);
    assert.ok(match, `expected a tab button for ${mode}`);
    const tag = match[0];
    const renderedLabel = htmlEscape(label);
    assert.match(tag, new RegExp(`aria-label="${renderedLabel}"`));
    assert.match(tag, new RegExp(`title="${renderedLabel}"`));
  }
});

test("DesktopSidebarTabs source uses the new visible label span (not sr-only) and an aria-current hint", () => {
  const source = sidebarSource();

  assert.match(
    source,
    /className="sidebar-tab-label"/,
    "DesktopSidebarTabs must render a <span class='sidebar-tab-label'> with the visible label",
  );
  assert.doesNotMatch(
    source,
    /className="sr-only"/,
    "DesktopSidebarTabs must not wrap the label in sr-only",
  );
  assert.match(
    source,
    /aria-current=\{[^}]*\}/,
    "DesktopSidebarTabs must wire aria-current based on the active mode",
  );
});

test("critical.css sidebar column is at least 240px on desktop so the labels fit", () => {
  const css = readFileSync("web/src/critical.css", "utf8");
  const match = css.match(
    /@media \(min-width: 761px\)\s*\{[\s\S]*?\.app-shell-console:not\(\.app-shell-mobile\)\s+\.console-layout\s*\{([\s\S]*?)\}/,
  );
  assert.ok(match, "expected desktop .console-layout rule inside @media (min-width: 761px)");
  assert.match(
    match[1],
    /grid-template-columns:\s*minmax\(\s*240px\s*,\s*[^)]+\)\s+minmax\(\s*0\s*,\s*1fr\s*\)\s+minmax\(\s*280px\s*,\s*320px\s*\)/,
    "first track must use minmax(240px, …) minmax(0, 1fr) minmax(280px, 320px)",
  );
});

test("App.tsx renders the sidebar through <DesktopSidebarTabs /> and no longer has an inline sr-only label", () => {
  const appSource = readFileSync("web/src/App.tsx", "utf8");

  assert.match(
    appSource,
    /<DesktopSidebarTabs\s+[^>]*\/?>/,
    "App.tsx must render <DesktopSidebarTabs /> for the workspace nav",
  );
  // The old markup had a <span class="sr-only"> label in the sidebar nav; ensure it's gone.
  const sidebarRegion = appSource.match(
    /<nav className="sidebar-nav"[\s\S]*?<\/nav>/,
  );
  if (sidebarRegion) {
    assert.doesNotMatch(
      sidebarRegion[0],
      /className="sr-only"/,
      "sidebar nav must no longer render an sr-only label",
    );
  }
});
