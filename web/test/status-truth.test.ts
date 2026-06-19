import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveStatusTruth,
  formatStatusTruthLabel,
  type StatusTruthState,
} from "../src/lib/status-truth.js";

const STATES: StatusTruthState[] = [
  "backend-ok",
  "credentials-missing",
  "integration-disconnected",
  "local-restored",
  "real-error",
];

test("deriveStatusTruth returns backend-ok when backend is healthy and nothing is wrong", () => {
  assert.equal(
    deriveStatusTruth({
      backendHealthy: true,
      restoredSession: false,
      openRouterConfigured: true,
      runtimeMode: "production",
      integration: { configured: true, status: "connected" },
      hasRealError: false,
    }),
    "backend-ok",
  );
});

test("deriveStatusTruth returns credentials-missing only when backend is healthy and runtime is production", () => {
  assert.equal(
    deriveStatusTruth({
      backendHealthy: true,
      restoredSession: false,
      openRouterConfigured: false,
      runtimeMode: "production",
      integration: { configured: true, status: "connected" },
      hasRealError: false,
    }),
    "credentials-missing",
  );
});

test("deriveStatusTruth stays backend-ok in non-production even without credentials", () => {
  assert.equal(
    deriveStatusTruth({
      backendHealthy: true,
      restoredSession: false,
      openRouterConfigured: false,
      runtimeMode: "development",
      integration: { configured: true, status: "connected" },
      hasRealError: false,
    }),
    "backend-ok",
  );
});

test("deriveStatusTruth returns integration-disconnected when an integration is not_connected", () => {
  assert.equal(
    deriveStatusTruth({
      backendHealthy: true,
      restoredSession: false,
      openRouterConfigured: true,
      runtimeMode: "production",
      integration: { configured: true, status: "not_connected" },
      hasRealError: false,
    }),
    "integration-disconnected",
  );
});

test("deriveStatusTruth returns integration-disconnected when integration config flag is false", () => {
  assert.equal(
    deriveStatusTruth({
      backendHealthy: true,
      restoredSession: false,
      openRouterConfigured: true,
      runtimeMode: "production",
      integration: { configured: false, status: "checking" },
      hasRealError: false,
    }),
    "integration-disconnected",
  );
});

test("deriveStatusTruth returns real-error when backend is healthy and a real error was reported", () => {
  assert.equal(
    deriveStatusTruth({
      backendHealthy: true,
      restoredSession: false,
      openRouterConfigured: true,
      runtimeMode: "production",
      integration: { configured: true, status: "connected" },
      hasRealError: true,
    }),
    "real-error",
  );
});

test("deriveStatusTruth returns local-restored when backend is unhealthy and a session was restored", () => {
  assert.equal(
    deriveStatusTruth({
      backendHealthy: false,
      restoredSession: true,
      openRouterConfigured: true,
      runtimeMode: "production",
      integration: { configured: true, status: "connected" },
      hasRealError: false,
    }),
    "local-restored",
  );
});

test("deriveStatusTruth returns local-restored when backend health is unknown and a session was restored", () => {
  assert.equal(
    deriveStatusTruth({
      backendHealthy: null,
      restoredSession: true,
      openRouterConfigured: true,
      runtimeMode: "production",
      integration: null,
      hasRealError: false,
    }),
    "local-restored",
  );
});

test("deriveStatusTruth returns local-restored when backend is unhealthy and nothing is restored yet", () => {
  // The hard rule says: never treat local absence as backend-fresh truth.
  // The default 5-state mapping shows the user "restored from local cache"
  // even before any session restore, so the chrome never claims
  // "Backend nicht verfügbar" when in fact we just don't know yet.
  assert.equal(
    deriveStatusTruth({
      backendHealthy: false,
      restoredSession: false,
      openRouterConfigured: true,
      runtimeMode: "production",
      integration: null,
      hasRealError: false,
    }),
    "local-restored",
  );
});

test("deriveStatusTruth prefers real-error over credentials-missing when both apply", () => {
  assert.equal(
    deriveStatusTruth({
      backendHealthy: true,
      restoredSession: false,
      openRouterConfigured: false,
      runtimeMode: "production",
      integration: { configured: true, status: "connected" },
      hasRealError: true,
    }),
    "real-error",
  );
});

test("formatStatusTruthLabel always returns a non-empty label and hint for every state in EN and DE", () => {
  for (const locale of ["en", "de"] as const) {
    for (const state of STATES) {
      const out = formatStatusTruthLabel(locale, state);
      assert.ok(out.label.length > 0, `${locale}/${state} must have a label`);
      assert.ok(out.hint.length > 0, `${locale}/${state} must have a hint`);
    }
  }
});

test("formatStatusTruthLabel does not leak any raw system token", () => {
  const forbidden = ["local-restored", "backend-fresh", "stale", "Backend-owned"];
  for (const locale of ["en", "de"] as const) {
    for (const state of STATES) {
      const out = formatStatusTruthLabel(locale, state);
      for (const token of forbidden) {
        assert.equal(
          out.label.includes(token),
          false,
          `${locale}/${state} label must not contain ${token}`,
        );
        assert.equal(
          out.hint.includes(token),
          false,
          `${locale}/${state} hint must not contain ${token}`,
        );
      }
    }
  }
});

test("formatStatusTruthLabel DE is meaningfully German", () => {
  const de = formatStatusTruthLabel("de", "backend-ok");
  assert.equal(de.label, "Backend erreichbar");
  assert.match(de.hint, /^Backend antwortet/);
});
