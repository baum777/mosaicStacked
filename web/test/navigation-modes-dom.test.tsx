import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DesktopSidebarTabs } from "../src/components/navigation/DesktopSidebarTabs.js";

const labels = {
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

function render(workMode: "beginner" | "expert") {
  return renderToStaticMarkup(
    React.createElement(DesktopSidebarTabs, {
      active: "chat",
      labels,
      ariaLabel: "Workspaces",
      onSelect: () => undefined,
      workMode,
    }),
  );
}

test("Beginner sidebar shows exactly five primary tabs and no secondary group", () => {
  const markup = render("beginner");
  const tabIds = ["tab-chat", "tab-workbench", "tab-matrix", "tab-settings", "tab-perf"];
  for (const id of tabIds) {
    assert.match(markup, new RegExp(`data-testid="${id}"`), `must include ${id}`);
  }
  const secondaryIds = ["tab-review", "tab-community", "tab-models", "tab-evidence"];
  for (const id of secondaryIds) {
    assert.doesNotMatch(markup, new RegExp(`data-testid="${id}"`), `must not include ${id}`);
  }
  assert.doesNotMatch(markup, /data-testid="sidebar-nav-group-secondary"/);
  assert.match(markup, /data-testid="sidebar-nav-group-primary"/);
  assert.match(markup, /data-mode="beginner"/);
});

test("Expert sidebar shows all nine tabs grouped into primary and secondary", () => {
  const markup = render("expert");
  for (const id of [
    "tab-chat",
    "tab-workbench",
    "tab-review",
    "tab-community",
    "tab-models",
    "tab-evidence",
    "tab-matrix",
    "tab-settings",
    "tab-perf",
  ]) {
    assert.match(markup, new RegExp(`data-testid="${id}"`), `must include ${id}`);
  }
  assert.match(markup, /data-testid="sidebar-nav-group-primary"/);
  assert.match(markup, /data-testid="sidebar-nav-group-secondary"/);
  assert.match(markup, /data-mode="expert"/);
});

test("Every primary tab carries data-nav-tier=primary and every secondary tab carries data-nav-tier=secondary", () => {
  const markup = render("expert");
  for (const mode of ["chat", "workbench", "matrix", "settings", "perf"]) {
    const re = new RegExp(`data-testid="tab-${mode}"[^>]*data-nav-tier="primary"`);
    assert.match(markup, re, `${mode} must be primary`);
  }
  for (const mode of ["review", "community", "models", "evidence"]) {
    const re = new RegExp(`data-testid="tab-${mode}"[^>]*data-nav-tier="secondary"`);
    assert.match(markup, re, `${mode} must be secondary`);
  }
});
