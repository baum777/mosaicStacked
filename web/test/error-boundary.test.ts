import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import test from "node:test";
import { ErrorBoundary, ErrorFallback, resolveErrorMessage } from "../src/components/ErrorBoundary.js";
import { LocaleProvider } from "../src/lib/localization.js";
import { recordShellTelemetry, registerShellTelemetrySink } from "../src/lib/shell-telemetry.js";

function renderWithLocale(node: React.ReactNode, locale: "en" | "de" = "en") {
  return renderToStaticMarkup(
    React.createElement(LocaleProvider, { initialLocale: locale }, node)
  );
}

function noopReload() {
  // no-op for tests
}

test("ErrorBoundary.getDerivedStateFromError transitions to hasError=true with the thrown error", () => {
  // Static class method — directly invokable in jsdom-free tests.
  const error = new Error("chunk load exploded");
  const state = ErrorBoundary.getDerivedStateFromError(error);

  assert.equal(state.hasError, true);
  assert.equal(state.error, error);
});

test("ErrorBoundary componentDidCatch records shell telemetry with the error label", () => {
  const recorded: Array<{ kind: string; label: string; detail?: string }> = [];
  const customHandlerCalls: Array<{ message: string }> = [];

  registerShellTelemetrySink((entry) => {
    recorded.push({ kind: entry.kind, label: entry.label, detail: entry.detail });
  });

  try {
    const boundary = new ErrorBoundary({
      children: null,
      onError: (error) => {
        customHandlerCalls.push({ message: error.message });
      }
    });

    const error = new Error("chunk load failure");
    const info: React.ErrorInfo = { componentStack: "\n  at ThrowingChild\n" };
    boundary.componentDidCatch(error, info);

    const errorEntry = recorded.find((entry) => entry.kind === "error");
    assert.ok(errorEntry, "an error telemetry entry must be recorded");
    assert.equal(errorEntry?.label, "Workspace chunk failed to load");
    assert.match(errorEntry?.detail ?? "", /chunk load failure/);
    assert.match(errorEntry?.detail ?? "", /ThrowingChild/);
    assert.equal(customHandlerCalls.length, 1);
    assert.equal(customHandlerCalls[0]?.message, "chunk load failure");
  } finally {
    registerShellTelemetrySink(null);
  }
});

test("ErrorBoundary componentDidCatch without custom onError still records telemetry", () => {
  const recorded: Array<{ kind: string; label: string; detail?: string }> = [];
  registerShellTelemetrySink((entry) => {
    recorded.push({ kind: entry.kind, label: entry.label, detail: entry.detail });
  });

  try {
    const boundary = new ErrorBoundary({ children: null });
    const error = new Error("bare boundary");
    const info: React.ErrorInfo = { componentStack: "" };
    boundary.componentDidCatch(error, info);

    const errorEntry = recorded.find((entry) => entry.kind === "error");
    assert.ok(errorEntry);
    assert.equal(errorEntry?.label, "Workspace chunk failed to load");
    assert.match(errorEntry?.detail ?? "", /bare boundary/);
  } finally {
    registerShellTelemetrySink(null);
  }
});

test("ErrorFallback renders with role=alert and aria-live=assertive for screen readers", () => {
  // The fallback is the DOM payload an ErrorBoundary renders once
  // getDerivedStateFromError fires. We render it directly via
  // renderToStaticMarkup to lock the accessibility contract.
  const error = new Error("chunk load exploded");
  const html = renderWithLocale(
    React.createElement(ErrorFallback, {
      error,
      title: "Workspace failed to load",
      hint: "A workspace code chunk failed to load. Reload to recover.",
      action: "Reload to recover",
      onReload: noopReload
    }),
    "en"
  );

  assert.match(html, /role="alert"/);
  assert.match(html, /aria-live="assertive"/);
  assert.match(html, /data-testid="workspace-error-boundary"/);
});

test("ErrorFallback shows the action button with the documented 'Reload to recover' label", () => {
  const error = new Error("chunk load exploded");
  const html = renderWithLocale(
    React.createElement(ErrorFallback, {
      error,
      title: "Workspace failed to load",
      hint: "A workspace code chunk failed to load. Reload to recover.",
      action: "Reload to recover",
      onReload: noopReload
    }),
    "en"
  );

  assert.match(html, /Reload to recover/);
  assert.match(html, /data-testid="workspace-error-boundary-reload"/);
  assert.match(html, /workspace-error-boundary-title/);
  assert.match(html, /workspace-error-boundary-hint/);
});

test("ErrorFallback surfaces the error message in a detail block when present", () => {
  const error = new Error("chunk load exploded with stack");
  const html = renderWithLocale(
    React.createElement(ErrorFallback, {
      error,
      title: "Workspace failed to load",
      hint: "Reload to recover.",
      action: "Reload to recover",
      onReload: noopReload
    }),
    "en"
  );

  assert.match(html, /chunk load exploded with stack/);
  assert.match(html, /data-testid="workspace-error-boundary-detail"/);
});

test("ErrorFallback hides the detail block when the error has no message", () => {
  const html = renderWithLocale(
    React.createElement(ErrorFallback, {
      error: null,
      title: "Workspace failed to load",
      hint: "Reload to recover.",
      action: "Reload to recover",
      onReload: noopReload
    }),
    "en"
  );

  assert.doesNotMatch(html, /data-testid="workspace-error-boundary-detail"/);
});

test("resolveErrorMessage falls back to error name when message is empty", () => {
  const error = new Error("");
  error.name = "ChunkLoadError";
  assert.equal(resolveErrorMessage(error), "ChunkLoadError");

  const blankError = new Error("   ");
  // React passes Error.message through; "   " is truthy here but resolveErrorMessage
  // prefers the explicit message when present. Add a name-only path check:
  const nameOnly = Object.assign(new Error(""), { name: "BareName" });
  assert.equal(resolveErrorMessage(nameOnly), "BareName");
});

test("recordShellTelemetry falls back to console.warn when no sink is registered", () => {
  registerShellTelemetrySink(null);
  const original = globalThis.console;
  const calls: string[] = [];
  (globalThis as { console: typeof console }).console = {
    ...original,
    warn: (message: string) => {
      calls.push(message);
    }
  } as typeof console;

  try {
    recordShellTelemetry({ kind: "error", label: "Test error", detail: "details here" });
    assert.equal(calls.length, 1);
    assert.match(calls[0] ?? "", /Test error/);
    assert.match(calls[0] ?? "", /details here/);
  } finally {
    (globalThis as { console: typeof console }).console = original;
  }
});

test("recordShellTelemetry with kind=info does not log to console when no sink is registered", () => {
  registerShellTelemetrySink(null);
  const original = globalThis.console;
  const calls: string[] = [];
  (globalThis as { console: typeof console }).console = {
    ...original,
    warn: (message: string) => {
      calls.push(message);
    },
    info: (message: string) => {
      calls.push(message);
    }
  } as typeof console;

  try {
    recordShellTelemetry({ kind: "info", label: "info only", detail: "no-op" });
    assert.equal(calls.length, 0);
  } finally {
    (globalThis as { console: typeof console }).console = original;
  }
});
