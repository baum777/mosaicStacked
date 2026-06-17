import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { TopContextBar } from "../src/components/mobile/layout/TopContextBar.js";

const criticalSource = () => readFileSync("web/src/critical.css", "utf8");

function renderTopBar(overrides: Partial<React.ComponentProps<typeof TopContextBar>> = {}) {
  return renderToStaticMarkup(
    React.createElement(TopContextBar, {
      brandIcon: React.createElement("span", null, "M"),
      title: "MosaicStacked",
      modelAlias: "default-free",
      healthTone: "ready",
      locale: "en",
      brandAriaLabel: "Switch to chat",
      modelAriaLabel: "Open model settings",
      languageAriaLabel: "Language",
      languageOptionEnglish: "EN",
      languageOptionGerman: "DE",
      settingsAriaLabel: "Open settings",
      onBrandClick: () => undefined,
      onBrandPointerCancel: () => undefined,
      onBrandPointerDown: () => undefined,
      onBrandPointerLeave: () => undefined,
      onBrandPointerUp: () => undefined,
      onModelPress: () => undefined,
      onLocaleChange: () => undefined,
      onSettingsPress: () => undefined,
      ...overrides,
    }),
  );
}

test("TopContextBar renders a visible settings entry button with aria-label (EN)", () => {
  const markup = renderTopBar();

  assert.match(
    markup,
    /<button[^>]*aria-label="Open settings"/,
    "expected a <button> with aria-label='Open settings'",
  );
});

test("TopContextBar renders localized settings aria-label (DE)", () => {
  const markup = renderTopBar({ locale: "de", settingsAriaLabel: "Einstellungen öffnen" });

  assert.match(
    markup,
    /<button[^>]*aria-label="Einstellungen öffnen"/,
    "expected a <button> with aria-label='Einstellungen öffnen'",
  );
});

test("TopContextBar settings button uses a visible icon affordance class", () => {
  const markup = renderTopBar();

  // The settings button must carry a non-empty class list and not be the brand or language button.
  const match = markup.match(/<button[^>]*aria-label="Open settings"[^>]*>/);
  assert.ok(match, "settings button not found");
  const buttonTag = match[0];
  assert.match(buttonTag, /class="[^"]*mobile-settings-button/);
});

test("TopContextBar has stable test id for the settings entry", () => {
  const markup = renderTopBar();

  assert.match(markup, /data-testid="mobile-settings-button"/);
});

test("TopContextBar keeps the brand long-press affordance intact (settings is additive)", () => {
  const markup = renderTopBar();

  // Brand button still exists for the long-press power-user gesture.
  assert.match(markup, /mobile-brand-button/);
  // Model badge stays.
  assert.match(markup, /mobile-model-badge/);
});

test("mobile settings button has a tap target of at least 44px on mobile", () => {
  const css = criticalSource();
  const match = css.match(/\.app-shell-mobile\s+\.mobile-settings-button\s*\{([\s\S]*?)\}/);
  assert.ok(match, "expected .app-shell-mobile .mobile-settings-button rule");
  assert.match(match[1], /min-width:\s*44px/);
  assert.match(match[1], /min-height:\s*44px/);
});
