import assert from "node:assert/strict";
import test from "node:test";
import { deriveShellFreshness } from "../src/lib/shell-freshness.js";

test("deriveShellFreshness returns backend-fresh when backend is healthy regardless of session restore", () => {
  assert.equal(
    deriveShellFreshness({ backendHealthy: true, restoredSession: false }),
    "backend-fresh"
  );
  assert.equal(
    deriveShellFreshness({ backendHealthy: true, restoredSession: true }),
    "backend-fresh"
  );
});

test("deriveShellFreshness returns local-restored when backend is unhealthy but session was restored", () => {
  assert.equal(
    deriveShellFreshness({ backendHealthy: false, restoredSession: true }),
    "local-restored"
  );
});

test("deriveShellFreshness returns stale when backend is unhealthy and no session was restored", () => {
  assert.equal(
    deriveShellFreshness({ backendHealthy: false, restoredSession: false }),
    "stale"
  );
});

test("deriveShellFreshness locks the null-backend + restored-session case to local-restored", () => {
  // The hard rule says: never treat restored local state as backend-fresh truth.
  // If a future refactor returns "backend-fresh" here, the freshness badge
  // would falsely claim live backend health, breaking the hard rule.
  assert.equal(
    deriveShellFreshness({ backendHealthy: null, restoredSession: true }),
    "local-restored"
  );
});

test("deriveShellFreshness returns stale when backend health is unknown and no session was restored", () => {
  assert.equal(
    deriveShellFreshness({ backendHealthy: null, restoredSession: false }),
    "stale"
  );
});

test("deriveShellFreshness full truth table is deterministic and exhaustive", () => {
  const cases: Array<{
    input: { backendHealthy: boolean | null; restoredSession: boolean };
    expected: "backend-fresh" | "local-restored" | "stale";
  }> = [
    { input: { backendHealthy: true,  restoredSession: false }, expected: "backend-fresh" },
    { input: { backendHealthy: true,  restoredSession: true  }, expected: "backend-fresh" },
    { input: { backendHealthy: false, restoredSession: true  }, expected: "local-restored" },
    { input: { backendHealthy: false, restoredSession: false }, expected: "stale" },
    { input: { backendHealthy: null,  restoredSession: true  }, expected: "local-restored" },
    { input: { backendHealthy: null,  restoredSession: false }, expected: "stale" }
  ];

  for (const { input, expected } of cases) {
    assert.equal(
      deriveShellFreshness(input),
      expected,
      `input=${JSON.stringify(input)} must yield ${expected}`
    );
  }
});
