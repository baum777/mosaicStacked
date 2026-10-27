import assert from "node:assert/strict";
import test from "node:test";
import type { IntegrationsStatusResponse } from "../src/lib/api.js";
import {
  deriveSettingsLoginAdapters,
  type SettingsLoginAdapterCopy,
} from "../src/lib/settings-login-adapters.js";

const COPY: SettingsLoginAdapterCopy = {
  checking: "Checking",
  unavailable: "Unavailable",
  none: "None",
};

function createIntegrationsFixture(): IntegrationsStatusResponse {
  return {
    generatedAt: "2026-10-27T00:00:00.000Z",
    github: {
      status: "connected",
      credentialSource: "user_connected",
      capabilities: { read: "available", propose: "available", execute: "approval_required", verify: "available" },
      executionMode: "approval_required",
      lastVerifiedAt: "2026-10-27T00:00:00.000Z",
      lastErrorCode: null,
      labels: {
        identity: "octocat",
        scope: "allowed repos resolved",
      },
    },
    matrix: {
      status: "not_connected",
      credentialSource: "not_connected",
      capabilities: { read: "unavailable", propose: "unavailable", execute: "unavailable", verify: "unavailable" },
      executionMode: "disabled",
      lastVerifiedAt: null,
      lastErrorCode: null,
      labels: {},
    },
  } as unknown as IntegrationsStatusResponse;
}

test("integrations still loading keeps adapters in the checking state", () => {
  const adapters = deriveSettingsLoginAdapters({ copy: COPY, integrations: null });

  assert.equal(adapters.length, 2);
  for (const adapter of adapters) {
    assert.equal(adapter.status, "checking");
    assert.equal(adapter.safeIdentityLabel, "Checking");
  }
});

test("failed integrations load surfaces a terminal unavailable state instead of eternal checking", () => {
  const adapters = deriveSettingsLoginAdapters({ copy: COPY, integrations: null, loadFailed: true });

  assert.equal(adapters.length, 2);
  for (const adapter of adapters) {
    assert.equal(adapter.status, "upstream_unreachable");
    assert.equal(adapter.safeIdentityLabel, "Unavailable");
    assert.equal(adapter.scopeSummary, "Unavailable");
    assert.equal(adapter.executionMode, "disabled");
    assert.equal(adapter.lastErrorCode, null);
  }
});

test("a successful integrations load ignores the failure flag and reports real status", () => {
  const adapters = deriveSettingsLoginAdapters({
    copy: COPY,
    integrations: createIntegrationsFixture(),
    loadFailed: false,
  });

  assert.equal(adapters[0]?.status, "connected");
  assert.equal(adapters[0]?.safeIdentityLabel, "Connected as octocat");
  assert.equal(adapters[1]?.status, "not_connected");
});

test("loadFailed defaults to false so existing callers keep checking behaviour", () => {
  const adapters = deriveSettingsLoginAdapters({ copy: COPY, integrations: null });

  assert.equal(adapters.every((adapter) => adapter.status === "checking"), true);
});
