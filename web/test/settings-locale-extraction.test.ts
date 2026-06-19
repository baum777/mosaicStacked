import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider, useLocalization } from "../src/lib/localization.js";
import {
  SettingsWorkspace,
  type SettingsTruthSnapshot,
  type SettingsVerificationState,
} from "../src/components/SettingsWorkspace.js";
import type { IntegrationsStatusResponse, JournalEntry } from "../src/lib/api.js";
import { deriveSettingsLoginAdapters } from "../src/lib/settings-login-adapters.js";

/**
 * Block E (Authority & Polish) regression gate for R13 (Settings locale
 * extraction).
 *
 * The `adapterCopy` and `openRouterCopy` blocks in
 * `web/src/components/SettingsWorkspace.tsx` (originally at L330–398 and
 * L412–468) were inline `locale === "de" ? {…} : {…}` blocks. Block E
 * extracts them into `web/src/lib/localization.tsx` as
 * `ui.settings.adapter` and `ui.settings.openRouter`. The `validation`
 * key on the `openRouter` block becomes function-typed so the
 * `OPENROUTER_API_KEY_MIN_LENGTH` runtime value can be interpolated
 * without baking it into the copy string.
 *
 * Strategy:
 *   1. Source-level: the inline `adapterCopy =` / `openRouterCopy =`
 *      ternary blocks must be gone from SettingsWorkspace.
 *   2. Source-level: all 10 moved EN keys and all 10 moved DE keys must
 *      appear in `web/src/lib/localization.tsx` (the keys are listed
 *      explicitly below).
 *   3. Runtime smoke: `<LocaleProvider initialLocale="…">` +
 *      `useLocalization()` must return the new keys, and
 *      `copy.settings.openRouter.validation(20)` must produce the
 *      existing EN/DE validation copy verbatim.
 *   4. Render regression: `<SettingsWorkspace />` must still emit the
 *      EN/DE adapter and openRouter copy.
 *
 * The `verificationCopy` block (L475–501) is deliberately NOT in scope
 * for Block E; that work is deferred to Block F.
 */

const settingsSourcePath = "web/src/components/SettingsWorkspace.tsx";
const localizationSourcePath = "web/src/lib/localization.tsx";

function readSettingsSource() {
  return readFileSync(settingsSourcePath, "utf8");
}

function readLocalizationSource() {
  return readFileSync(localizationSourcePath, "utf8");
}

const EN_KEYS = [
  "Access",
  "Action",
  "Requirements",
  "Connect available",
  "OpenRouter models",
  "Save",
  "Test connection",
  "Show key",
  "Local diagnostic (browser only)",
  "Default limits",
  "Default-free status",
];

const DE_KEYS = [
  "Zugänge",
  "Aktion",
  "Voraussetzungen",
  "Verbinden verfügbar",
  "OpenRouter Modelle",
  "Speichern",
  "Verbindung testen",
  "Key anzeigen",
  "Default-Limits",
  "Default-Free-Status",
];

test("R13: SettingsWorkspace no longer declares the inline adapterCopy = locale === 'de' ? ternary", () => {
  const source = readSettingsSource();

  assert.doesNotMatch(
    source,
    /const\s+adapterCopy\s*=\s*locale\s*===\s*"de"\s*\?/,
    "SettingsWorkspace must read `adapterCopy` from `ui.settings.adapter`; the inline ternary must be removed",
  );
});

test("R13: SettingsWorkspace no longer declares the inline openRouterCopy = locale === 'de' ? ternary", () => {
  const source = readSettingsSource();

  assert.doesNotMatch(
    source,
    /const\s+openRouterCopy\s*=\s*locale\s*===\s*"de"\s*\?/,
    "SettingsWorkspace must read `openRouterCopy` from `ui.settings.openRouter`; the inline ternary must be removed",
  );
});

test("R13: localization.tsx carries the moved EN copy keys under settings.adapter / settings.openRouter", () => {
  const source = readLocalizationSource();

  for (const key of EN_KEYS) {
    assert.match(
      source,
      new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `localization.tsx must contain the moved EN copy key: ${key}`,
    );
  }
});

test("R13: localization.tsx carries the moved DE copy keys under settings.adapter / settings.openRouter", () => {
  const source = readLocalizationSource();

  for (const key of DE_KEYS) {
    assert.match(
      source,
      new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `localization.tsx must contain the moved DE copy key: ${key}`,
    );
  }
});

function ProbeComponent({ capture }: { capture: (value: ReturnType<typeof useLocalization>) => void }) {
  capture(useLocalization());
  return null;
}

test("R13: useLocalization() runtime smoke — new keys are reachable from ui.settings.adapter and ui.settings.openRouter in both locales", () => {
  let enValue: ReturnType<typeof useLocalization> | null = null;
  let deValue: ReturnType<typeof useLocalization> | null = null;

  renderToStaticMarkup(
    React.createElement(
      LocaleProvider,
      { initialLocale: "en" },
      React.createElement(ProbeComponent, { capture: (v) => { enValue = v; } }),
    ),
  );
  renderToStaticMarkup(
    React.createElement(
      LocaleProvider,
      { initialLocale: "de" },
      React.createElement(ProbeComponent, { capture: (v) => { deValue = v; } }),
    ),
  );

  assert.ok(enValue, "EN probe did not capture a localization value");
  assert.ok(deValue, "DE probe did not capture a localization value");

  // Adapter shape
  assert.equal(enValue!.copy.settings.adapter.accessTitle, "Access");
  assert.equal(enValue!.copy.settings.adapter.actionLabel, "Action");
  assert.equal(enValue!.copy.settings.adapter.requirementsLabel, "Requirements");
  assert.equal(deValue!.copy.settings.adapter.accessTitle, "Zugänge");
  assert.equal(deValue!.copy.settings.adapter.actionLabel, "Aktion");
  assert.equal(deValue!.copy.settings.adapter.requirementsLabel, "Voraussetzungen");

  // OpenRouter shape
  assert.equal(enValue!.copy.settings.openRouter.title, "OpenRouter models");
  assert.equal(enValue!.copy.settings.openRouter.save, "Save");
  assert.equal(enValue!.copy.settings.openRouter.test, "Test connection");
  assert.equal(deValue!.copy.settings.openRouter.title, "OpenRouter Modelle");
  assert.equal(deValue!.copy.settings.openRouter.save, "Speichern");
  assert.equal(deValue!.copy.settings.openRouter.test, "Verbindung testen");

  // Function-typed validation: runtime string must match the previous
  // template literal byte-for-byte.
  const enValidation = enValue!.copy.settings.openRouter.validation(20);
  const deValidation = deValue!.copy.settings.openRouter.validation(20);
  assert.equal(
    enValidation,
    "OpenRouter API key must have at least 20 characters; model ID must use provider/model.",
  );
  assert.equal(
    deValidation,
    "OpenRouter API Key braucht mindestens 20 Zeichen; die Modell-ID muss provider/model verwenden.",
  );
});

function createIntegrationsStatusFixture(): IntegrationsStatusResponse {
  return {
    ok: true,
    generatedAt: "2026-04-27T12:00:00.000Z",
    github: {
      status: "connected",
      credentialSource: "user_connected",
      capabilities: {
        read: "available",
        propose: "available",
        execute: "approval_required",
        verify: "available",
      },
      executionMode: "approval_required",
      labels: {
        identity: "octocat",
        scope: "2 allowed repos",
        allowedReposStatus: "configured",
      },
      lastVerifiedAt: "2026-04-27T12:00:00.000Z",
      lastErrorCode: null,
    },
    matrix: {
      status: "connect_available",
      credentialSource: "not_connected",
      capabilities: {
        read: "blocked",
        propose: "blocked",
        execute: "blocked",
        verify: "blocked",
      },
      executionMode: "disabled",
      labels: {
        identity: null,
        scope: "Matrix scope unavailable until backend config is ready.",
        homeserver: null,
        roomAccess: "unknown",
      },
      lastVerifiedAt: null,
      lastErrorCode: null,
    },
  };
}

function createVerificationFixture(): Record<"backend" | "github" | "matrix", SettingsVerificationState> {
  return {
    backend: {
      status: "passed",
      detail: "mosaicstacked-test (local)",
      checkedAt: "2026-04-27T12:00:00.000Z",
    },
    github: {
      status: "idle",
      detail: "",
      checkedAt: null,
    },
    matrix: {
      status: "failed",
      detail: "Matrix credentials were rejected",
      checkedAt: "2026-04-27T12:01:00.000Z",
    },
  };
}

function createSettingsTruthSnapshotFixture(): SettingsTruthSnapshot {
  return {
    backend: { label: "Ready", detail: "Backend truth." },
    github: {
      sessionLabel: "n/a",
      connectionLabel: "n/a",
      repositoryLabel: "n/a",
      accessLabel: "n/a",
    },
    matrix: {
      identityLabel: "n/a",
      connectionLabel: "n/a",
      homeserverLabel: "n/a",
      scopeLabel: "n/a",
    },
    models: {
      activeAlias: "default",
      availableCount: 1,
      registrySourceLabel: "backend-policy",
      defaultFreeStatus: "configured",
    },
    diagnostics: {
      runtimeMode: "local",
      defaultPublicAlias: "default",
      publicAliases: "default",
      routingMode: "policy",
      fallbackEnabled: "Active",
      failClosed: "Active",
      rateLimitEnabled: "Active",
      rateLimitDefaults: "chat:30, auth:8, gh-propose:10, gh-exec:6, matrix-exec:6",
      actionStoreMode: "memory",
      githubConfigured: "Configured",
      matrixConfigured: "Configured",
      generatedAt: "2026-04-27T12:00:00.000Z",
      uptimeMs: "0",
      chatRequests: "0",
      chatStreamStarted: "0",
      chatStreamCompleted: "0",
      chatStreamError: "0",
      chatStreamAborted: "0",
      upstreamError: "0",
      rateLimitBlocked: "none",
    },
    journal: {
      status: "Configured",
      mode: "memory",
      retention: "0/500",
      recentCount: "0",
      entries: [],
    },
  };
}

function renderSettingsWorkspaceMarkup(locale: "en" | "de") {
  const loginAdapters = deriveSettingsLoginAdapters({
    copy: {
      checking: "Checking",
      unavailable: "Unavailable",
      none: "None",
    },
    integrations: createIntegrationsStatusFixture(),
  });

  return renderToStaticMarkup(
    React.createElement(
      LocaleProvider,
      { initialLocale: locale },
      React.createElement(SettingsWorkspace, {
        workMode: "beginner",
        onWorkModeChange: () => undefined,
        diagnostics: [],
        onClearDiagnostics: () => undefined,
        truthSnapshot: createSettingsTruthSnapshotFixture(),
        loginAdapters,
        onIntegrationAction: () => undefined,
        openRouterCredentialStatus: {
          configured: false,
          models: [],
          defaultFree: {
            alias: "default-free",
            label: "Free default",
            source: "env_configured",
            status: "configured",
            modelId: "deepseek/deepseek-v4-flash:free",
          },
        },
        openRouterApiKeyInput: "sk-or-v1-test-key-with-enough-length",
        openRouterModelInput: "deepseek/deepseek-v4-flash:free",
        onOpenRouterApiKeyInputChange: () => undefined,
        onOpenRouterModelInputChange: () => undefined,
        onSaveOpenRouterCredentials: () => undefined,
        onTestOpenRouterCredentials: () => undefined,
        isSavingOpenRouterCredentials: false,
        isTestingOpenRouterCredentials: false,
        openRouterCredentialMessage: null,
        buildIntegrationStartUrl: (provider: "github" | "matrix") => `/api/auth/${provider}/start?returnTo=%2Fconsole%3Fmode%3Dsettings`,
        verificationResults: createVerificationFixture(),
        onVerifyConnection: () => undefined,
        matrixHierarchyEnabled: false,
      }),
    ),
  );
}

test("R13: SettingsWorkspace render regression — EN copy still includes the moved adapter/openRouter strings", () => {
  const markup = renderSettingsWorkspaceMarkup("en");

  // Brief: EN strings "Access", "OpenRouter models", "Test connection".
  // These are beginner-mode visible (mobile summary + openrouter form).
  assert.match(markup, />\s*Access\s*</);
  assert.match(markup, />\s*OpenRouter models\s*</);
  assert.match(markup, />\s*Test connection\s*</);
});

test("R13: SettingsWorkspace render regression — DE copy still includes the moved adapter/openRouter strings", () => {
  const markup = renderSettingsWorkspaceMarkup("de");

  // Brief: DE equivalents of "Access", "OpenRouter models", "Test connection".
  assert.match(markup, />\s*Zugänge\s*</);
  assert.match(markup, />\s*OpenRouter Modelle\s*</);
  assert.match(markup, />\s*Verbindung testen\s*</);
});

// Re-use the JournalEntry type so the fixture compiles even if the
// api.js JournalEntry shape changes upstream.
type _JournalEntryRef = JournalEntry;
