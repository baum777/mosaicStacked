import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BottomNav, type BottomNavItem } from "../src/components/navigation/BottomNav.js";

const criticalSource = () => readFileSync("web/src/critical.css", "utf8");

test("mobile bottom nav declares five equal tracks for five tabs", () => {
  const css = criticalSource();
  const match = css.match(/\.app-shell-mobile\s+\.mobile-bottom-nav\s*\{([\s\S]*?)\}/);

  assert.ok(match, "expected .app-shell-mobile .mobile-bottom-nav rule in critical.css");
  assert.match(
    match[1],
    /grid-template-columns:\s*repeat\(\s*5\s*,\s*minmax\(\s*0\s*,\s*1fr\s*\)\s*\)/,
    "grid-template-columns must declare 5 tracks",
  );
});

test("BottomNav renders the approval badge when badge prop is a number", () => {
  const items: BottomNavItem[] = [
    {
      key: "workbench",
      label: "Workbench",
      icon: React.createElement("span", null, "W"),
      badge: 3,
      onPress: () => undefined,
    },
    {
      key: "chat",
      label: "Chat",
      icon: React.createElement("span", null, "C"),
      onPress: () => undefined,
    },
  ];
  const markup = renderToStaticMarkup(
    React.createElement(BottomNav, { ariaLabel: "Workspaces", items }),
  );

  assert.match(markup, /mobile-bottom-nav-badge/);
  assert.match(markup, />3</);
});

test("BottomNav renders the approval badge when badge prop is a string", () => {
  const items: BottomNavItem[] = [
    {
      key: "workbench",
      label: "Workbench",
      icon: React.createElement("span", null, "W"),
      badge: "12",
      onPress: () => undefined,
    },
  ];
  const markup = renderToStaticMarkup(
    React.createElement(BottomNav, { ariaLabel: "Workspaces", items }),
  );

  assert.match(markup, /mobile-bottom-nav-badge/);
  assert.match(markup, />12</);
});

test("BottomNav omits the badge element when badge prop is not provided", () => {
  const items: BottomNavItem[] = [
    {
      key: "chat",
      label: "Chat",
      icon: React.createElement("span", null, "C"),
      onPress: () => undefined,
    },
  ];
  const markup = renderToStaticMarkup(
    React.createElement(BottomNav, { ariaLabel: "Workspaces", items }),
  );

  assert.doesNotMatch(markup, /mobile-bottom-nav-badge/);
});

test("BottomNav accepts a badge prop typed as string or number", () => {
  // Compile-time check: assignability of number and string to BottomNavItem.badge.
  const numeric: BottomNavItem = {
    key: "k",
    label: "l",
    icon: null,
    badge: 5,
    onPress: () => undefined,
  };
  const text: BottomNavItem = {
    key: "k",
    label: "l",
    icon: null,
    badge: "5",
    onPress: () => undefined,
  };
  assert.equal(numeric.badge, 5);
  assert.equal(text.badge, "5");
});
