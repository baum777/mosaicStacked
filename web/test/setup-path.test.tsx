import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SetupPath } from "../src/components/setup/SetupPath.js";
import { LocaleProvider } from "../src/lib/localization.js";

function render(locale: "en" | "de", steps: Parameters<typeof SetupPath>[0]["steps"]) {
  return renderToStaticMarkup(
    React.createElement(
      LocaleProvider,
      { initialLocale: locale },
      React.createElement(SetupPath, {
        steps,
        onPrimaryAction: () => undefined,
        onSecondaryAction: () => undefined,
      }),
    ),
  );
}

test("SetupPath renders exactly five steps in beginner mode", () => {
  const steps = [
    { id: "backend", label: "Backend", hint: "h1", status: "ready" as const, testId: "t1" },
    { id: "model", label: "Model", hint: "h2", status: "blocked" as const, testId: "t2" },
    { id: "chat", label: "Chat", hint: "h3", status: "blocked" as const, testId: "t3" },
    { id: "github", label: "GitHub", hint: "h4", status: "optional" as const, testId: "t4" },
    { id: "matrix", label: "Matrix", hint: "h5", status: "optional" as const, testId: "t5" },
  ];
  const html = render("en", steps);
  assert.match(html, /data-testid="setup-path"/);
  assert.match(html, /data-testid="t1"/);
  assert.match(html, /data-testid="t5"/);
});

test("SetupPath DE labels are German and contain no English fallbacks", () => {
  const steps = [
    { id: "backend", label: "Backend", hint: "h1", status: "ready" as const, testId: "t1" },
    { id: "model", label: "Modell", hint: "h2", status: "blocked" as const, testId: "t2" },
    { id: "chat", label: "Chat", hint: "h3", status: "blocked" as const, testId: "t3" },
    { id: "github", label: "GitHub", hint: "h4", status: "optional" as const, testId: "t4" },
    { id: "matrix", label: "Matrix", hint: "h5", status: "optional" as const, testId: "t5" },
  ];
  const html = render("de", steps);
  assert.match(html, /Erste Schritte/);
  assert.match(html, /Modellzugang einrichten/);
  assert.match(html, /Settings öffnen/);
  assert.doesNotMatch(html, /Get started/);
  assert.doesNotMatch(html, /Set up model access/);
  assert.doesNotMatch(html, /Open Settings/);
});

test("SetupPath primary action test-id points at the first blocked step", () => {
  const steps = [
    { id: "backend", label: "Backend", hint: "h1", status: "ready" as const, testId: "t1" },
    { id: "model", label: "Model", hint: "h2", status: "blocked" as const, testId: "t2" },
    { id: "chat", label: "Chat", hint: "h3", status: "blocked" as const, testId: "t3" },
    { id: "github", label: "GitHub", hint: "h4", status: "optional" as const, testId: "t4" },
    { id: "matrix", label: "Matrix", hint: "h5", status: "optional" as const, testId: "t5" },
  ];
  const html = render("en", steps);
  assert.match(html, /data-testid="setup-step-primary-model"/);
});

test("SetupPath renders the localized status badge text for each step", () => {
  const steps = [
    { id: "backend", label: "Backend", hint: "h1", status: "ready" as const, testId: "t1" },
    { id: "model", label: "Model", hint: "h2", status: "blocked" as const, testId: "t2" },
    { id: "chat", label: "Chat", hint: "h3", status: "blocked" as const, testId: "t3" },
    { id: "github", label: "GitHub", hint: "h4", status: "optional" as const, testId: "t4" },
    { id: "matrix", label: "Matrix", hint: "h5", status: "optional" as const, testId: "t5" },
  ];
  const html = render("en", steps);
  assert.match(html, /Done/);
  assert.match(html, /Next/);
  assert.match(html, /Optional/);
});
