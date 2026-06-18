import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import App, {
  persistShellState,
  readPersistedShellState,
  resolveAppSurface,
  shouldConfirmGitHubReviewNavigation,
} from "../src/App.js";
import { LocaleProvider } from "../src/lib/localization.js";

function withWindow<T>(windowValue: Partial<Window>, fn: () => T) {
  const globalAny = globalThis as unknown as { window?: Window };
  const previousWindow = globalAny.window;
  try {
    globalAny.window = windowValue as Window;
    return fn();
  } finally {
    globalAny.window = previousWindow;
  }
}

test("app shell renders core EN labels", () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      LocaleProvider,
      { initialLocale: "en" },
      React.createElement(App),
    ),
  );

  assert.match(markup, /MosaicStacked Console/);
  assert.match(markup, /Workspaces/);
  assert.match(markup, /Language/);
});

test("app shell renders core DE labels", () => {
  const markup = renderToStaticMarkup(
    React.createElement(
      LocaleProvider,
      { initialLocale: "de" },
      React.createElement(App),
    ),
  );

  assert.match(markup, /MosaicStacked Konsole/);
  assert.match(markup, /Arbeitsbereiche/);
  assert.match(markup, /Sprache/);
  assert.match(markup, /Neue Session/);
  assert.doesNotMatch(markup, /Wiederaufnehmbare Sessions pro Arbeitsbereich/);
});

test("app route resolver separates preview, README landing, and console", () => {
  assert.equal(resolveAppSurface("https://example.test/"), "preview");
  assert.equal(resolveAppSurface("https://example.test/readme"), "readme");
  assert.equal(resolveAppSurface("https://example.test/handbook"), "readme");
  assert.equal(resolveAppSurface("https://example.test/console?mode=chat"), "console");
  assert.equal(resolveAppSurface("https://example.test/?console=1"), "console");
});

test("Workbench navigation guard only triggers when leaving Workbench with local dirty review state", () => {
  assert.equal(shouldConfirmGitHubReviewNavigation({
    currentMode: "workbench",
    nextMode: "chat",
    githubReviewDirty: true,
  }), true);

  assert.equal(shouldConfirmGitHubReviewNavigation({
    currentMode: "workbench",
    nextMode: "workbench",
    githubReviewDirty: true,
  }), false);

  assert.equal(shouldConfirmGitHubReviewNavigation({
    currentMode: "chat",
    nextMode: "matrix",
    githubReviewDirty: true,
  }), false);

  assert.equal(shouldConfirmGitHubReviewNavigation({
    currentMode: "workbench",
    nextMode: "settings",
    githubReviewDirty: false,
  }), false);
});

test("legacy workspace URL modes normalize to workbench and shell tabs include all nine workspaces", () => {
  const source = readFileSync("web/src/App.tsx", "utf8");

  assert.match(source, /if \(value === "github" \|\| value === "context"\) \{\s*return "workbench";\s*\}/);
  assert.match(source, /const WORKSPACE_MODES: WorkspaceMode\[\] = \["chat", "workbench", "review", "community", "models", "evidence", "matrix", "settings", "perf"\]/);
  assert.match(source, /const MOBILE_NAV_MODES: WorkspaceMode\[\] = \["chat", "workbench", "review", "community", "models", "evidence", "matrix", "settings", "perf"\]/);
  assert.match(source, /handleWorkspaceTabSelect\("perf"\)/);
  // The landing-page surfaces moved to web/src/landing/LandingPage.tsx
  // in Block F (F5). The shell still routes to them via the
  // re-exported `LandingReadmePage` / `LandingPublicPreview` aliases.
  assert.match(source, /["'][^"']*landing\/LandingPage\.js["']/);
  assert.match(source, /surface === "readme" \? <(?:Lazy)?LandingReadmePage \/> : <(?:Lazy)?LandingPublicPreview \/>/);
});

// Companion check: the landing entry-gate redirect to /console is
// owned by web/src/landing/LandingPage.tsx (Block F F5 extraction).
// It used to live in App.tsx.
test("landing entry gate redirects to /console (now lives in web/src/landing/LandingPage.tsx)", () => {
  const landingSource = readFileSync("web/src/landing/LandingPage.tsx", "utf8");
  assert.match(landingSource, /window\.location\.replace\(["']\/console["']\)/);
  assert.match(landingSource, /LANDING_ENTRY_GUIDE_KEY\s*=\s*["']landing-entry["']/);
  assert.match(landingSource, /markGuideKeySeen\(LANDING_ENTRY_GUIDE_KEY\)/);
});

test("persisted shell state expires after the local restore TTL", () => {
  const storage = new Map<string, string>();
  const fakeWindow = {
    localStorage: {
      getItem(key: string) {
        return storage.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        storage.set(key, value);
      },
      removeItem(key: string) {
        storage.delete(key);
      },
    },
  } as Partial<Window>;

  storage.set("mosaicstacked.console.shell.v2", JSON.stringify({
    activeTab: "matrix",
    workMode: "expert",
    savedAt: new Date(Date.now() - (8 * 24 * 60 * 60 * 1000)).toISOString(),
  }));

  assert.equal(withWindow(fakeWindow, () => readPersistedShellState()), null);

  storage.set("mosaicstacked.console.shell.v2", JSON.stringify({
    activeTab: "matrix",
    workMode: "expert",
    savedAt: new Date(Date.now() - (2 * 24 * 60 * 60 * 1000)).toISOString(),
  }));

  assert.deepEqual(withWindow(fakeWindow, () => readPersistedShellState()), {
    activeTab: "matrix",
    workMode: "expert",
    savedAt: storage.get("mosaicstacked.console.shell.v2")
      ? JSON.parse(storage.get("mosaicstacked.console.shell.v2") as string).savedAt
      : "",
  });
});

test("persisted shell state requires savedAt and writes fail closed", () => {
  const storage = new Map<string, string>();
  const fakeWindow = {
    localStorage: {
      getItem(key: string) {
        return storage.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        storage.set(key, value);
      },
      removeItem(key: string) {
        storage.delete(key);
      },
    },
  } as Partial<Window>;

  storage.set("mosaicstacked.console.shell.v2", JSON.stringify({
    activeTab: "chat",
    workMode: "beginner",
  }));

  assert.equal(withWindow(fakeWindow, () => readPersistedShellState()), null);

  withWindow(fakeWindow, () => persistShellState({
    activeTab: "workbench",
    workMode: "expert",
  }));

  const persisted = JSON.parse(storage.get("mosaicstacked.console.shell.v2") ?? "{}") as {
    activeTab?: string;
    workMode?: string;
    savedAt?: string;
  };
  assert.equal(persisted.activeTab, "workbench");
  assert.equal(persisted.workMode, "expert");
  assert.ok(persisted.savedAt);
  assert.doesNotThrow(() => new Date(persisted.savedAt as string).toISOString());

  const throwingWindow = {
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {
        throw Object.assign(new Error("quota exceeded"), { name: "QuotaExceededError" });
      },
      removeItem() {
        // no-op
      },
    },
  } as Partial<Window>;

  assert.doesNotThrow(() => {
    withWindow(throwingWindow, () => persistShellState({ activeTab: "matrix" }));
  });
});
