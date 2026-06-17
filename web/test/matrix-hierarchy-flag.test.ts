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
 * Block E (Authority & Polish) regression gate for R11 (Matrix hierarchy
 * feature flag surfaced in Settings).
 *
 * The `MATRIX_HIERARCHY_ENABLED` flag is already defined in
 * `web/src/App.tsx` (L260) and plumbed into `MatrixWorkspace`. Block E
 * extends that to `SettingsWorkspace` so the expert-mode
 * `settings-diagnostics-card` can show whether the Matrix hierarchy
 * surface is currently available. The new row:
 *
 *   - uses the `ui.settings.matrixHierarchy` label,
 *   - shows the available/hidden value via the new
 *     `ui.settings.matrixHierarchyEnabledValue` /
 *     `ui.settings.matrixHierarchyDisabledValue` keys,
 *   - is only rendered in expert mode (beginner mode does NOT see
 *     the new `data-testid`),
 *   - is preceded by a help paragraph that mentions the
 *     `VITE_MATRIX_HIERARCHY` env var so the user knows how to flip
 *     the flag.
 *
 * Strategy:
 *   1. Source-level: `App.tsx` plumbs the flag into
 *      `settingsWorkspaceProps` (useMemo pattern) AND into its dep
 *      array, mirroring the existing `matrixWorkspaceProps` plumbing.
 *   2. Source-level: `SettingsWorkspaceProps` declares
 *      `matrixHierarchyEnabled: boolean` and the function destructure
 *      reads it.
 *   3. Render-level: the expert-mode markup contains
 *      `<strong data-testid="settings-matrix-hierarchy-status">` with
 *      a value matching the locale's available/hidden label; the
 *      beginner-mode markup does NOT contain that `data-testid`.
 *   4. Localization: `web/src/lib/localization.tsx` carries a
 *      `matrixHierarchyHelp` key whose EN and DE strings both mention
 *      `VITE_MATRIX_HIERARCHY`.
 *
 * The verificationCopy and openRouter copy are unrelated to R11; this
 * file only checks the hierarchy surface.
 */

const appPath = "web/src/App.tsx";
const settingsPath = "web/src/components/SettingsWorkspace.tsx";
const localizationPath = "web/src/lib/localization.tsx";

function readApp() { return readFileSync(appPath, "utf8"); }
function readSettings() { return readFileSync(settingsPath, "utf8"); }
function readLocalization() { return readFileSync(localizationPath, "utf8"); }

test("R11: App.tsx plumbs matrixHierarchyEnabled: MATRIX_HIERARCHY_ENABLED into settingsWorkspaceProps", () => {
  const source = readApp();

  // The settingsWorkspaceProps useMemo must carry the new key.
  // Match the literal property name to the const, mirroring the
  // matrixWorkspaceProps pattern at L2311–2346.
  const settingsBlock = source.match(
    /const\s+settingsWorkspaceProps\s*=\s*useMemo\(\s*\(\s*\)\s*=>\s*\(\s*\{([\s\S]*?)\}\s*\)/,
  );
  assert.ok(settingsBlock, "expected to find settingsWorkspaceProps useMemo in App.tsx");
  assert.match(
    settingsBlock[1],
    /matrixHierarchyEnabled:\s*MATRIX_HIERARCHY_ENABLED/,
    "settingsWorkspaceProps must include `matrixHierarchyEnabled: MATRIX_HIERARCHY_ENABLED`",
  );
});

test("R11: SettingsWorkspaceProps declares `matrixHierarchyEnabled: boolean`", () => {
  const source = readSettings();

  // Match the type body of SettingsWorkspaceProps with a balanced-brace
  // counter (regex alone stops at the first nested `};`).
  const startMatch = source.match(/type\s+SettingsWorkspaceProps\s*=\s*\{/);
  assert.ok(startMatch, "expected to find SettingsWorkspaceProps type declaration");
  const startIdx = startMatch.index! + startMatch[0].length;
  let depth = 1;
  let endIdx = -1;
  for (let i = startIdx; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  assert.ok(endIdx > 0, "expected to find the closing brace of SettingsWorkspaceProps");
  const typeBody = source.slice(startIdx, endIdx);

  assert.match(
    typeBody,
    /matrixHierarchyEnabled:\s*boolean\s*;/,
    "SettingsWorkspaceProps must declare `matrixHierarchyEnabled: boolean;`",
  );
});

test("R11: SettingsWorkspace destructures matrixHierarchyEnabled in the function signature", () => {
  const source = readSettings();

  // The component function signature must read the prop.
  assert.match(
    source,
    /export\s+function\s+SettingsWorkspace\s*\(\s*\{[\s\S]*?matrixHierarchyEnabled[\s\S]*?\}\s*:\s*SettingsWorkspaceProps\s*\)/,
    "SettingsWorkspace must destructure `matrixHierarchyEnabled` from props",
  );

  // And the prop must appear in the expert-mode diagnostics render
  // (the source must reference the identifier more than once for it
  // to be wired in the render path, not just declared in the type).
  const occurrences = source.match(/matrixHierarchyEnabled/g) ?? [];
  assert.ok(
    occurrences.length >= 3,
    `expected at least 3 occurrences of matrixHierarchyEnabled (prop type, destructure, render); got ${occurrences.length}`,
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

function renderSettings({
  locale,
  workMode,
  matrixHierarchyEnabled,
}: {
  locale: "en" | "de";
  workMode: "beginner" | "expert";
  matrixHierarchyEnabled: boolean;
}) {
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
        workMode,
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
        openRouterApiKeyInput: "",
        openRouterModelInput: "",
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
        matrixHierarchyEnabled,
      }),
    ),
  );
}

test("R11: expert-mode render shows the Matrix hierarchy status with the enabled value (EN)", () => {
  const markup = renderSettings({
    locale: "en",
    workMode: "expert",
    matrixHierarchyEnabled: true,
  });

  assert.match(
    markup,
    /<strong[^>]*data-testid="settings-matrix-hierarchy-status"[^>]*>\s*Available\s*<\/strong>/,
    "expert-mode EN render must show data-testid='settings-matrix-hierarchy-status' with 'Available' when enabled",
  );
});

test("R11: expert-mode render shows the Matrix hierarchy status with the disabled value (EN)", () => {
  const markup = renderSettings({
    locale: "en",
    workMode: "expert",
    matrixHierarchyEnabled: false,
  });

  assert.match(
    markup,
    /<strong[^>]*data-testid="settings-matrix-hierarchy-status"[^>]*>\s*Hidden\s*<\/strong>/,
    "expert-mode EN render must show data-testid='settings-matrix-hierarchy-status' with 'Hidden' when disabled",
  );
});

test("R11: expert-mode render shows the Matrix hierarchy status with the DE enabled value", () => {
  const markup = renderSettings({
    locale: "de",
    workMode: "expert",
    matrixHierarchyEnabled: true,
  });

  assert.match(
    markup,
    /<strong[^>]*data-testid="settings-matrix-hierarchy-status"[^>]*>\s*Verfügbar\s*<\/strong>/,
    "expert-mode DE render must show data-testid='settings-matrix-hierarchy-status' with 'Verfügbar' when enabled",
  );
});

test("R11: beginner-mode render does NOT contain the Matrix hierarchy status data-testid", () => {
  const markup = renderSettings({
    locale: "en",
    workMode: "beginner",
    matrixHierarchyEnabled: true,
  });

  assert.doesNotMatch(
    markup,
    /data-testid="settings-matrix-hierarchy-status"/,
    "beginner-mode render must not show the Matrix hierarchy status (expert-only)",
  );
});

test("R11: localization.tsx carries a matrixHierarchyHelp key whose EN and DE strings mention VITE_MATRIX_HIERARCHY", () => {
  const source = readLocalization();

  // EN string must mention the env var.
  // We look for `matrixHierarchyHelp: "…VITE_MATRIX_HIERARCHY…"` in the EN block.
  const enHelpMatch = source.match(
    /matrixHierarchyHelp:\s*["']([^"']*VITE_MATRIX_HIERARCHY[^"']*)["']/,
  );
  assert.ok(enHelpMatch, "expected an EN matrixHierarchyHelp string that mentions VITE_MATRIX_HIERARCHY");
  assert.match(
    enHelpMatch[1],
    /VITE_MATRIX_HIERARCHY/,
    "EN matrixHierarchyHelp must include the env-var name VITE_MATRIX_HIERARCHY",
  );

  // DE string must mention the env var too (different sentence, same flag).
  const deHelpMatch = source.match(
    /matrixHierarchyHelp:\s*["']([^"']*VITE_MATRIX_HIERARCHY[^"']*)["']/g,
  );
  assert.ok(deHelpMatch, "expected at least one matrixHierarchyHelp string with VITE_MATRIX_HIERARCHY");
  assert.ok(
    deHelpMatch.length >= 2,
    `expected both EN and DE matrixHierarchyHelp strings to mention VITE_MATRIX_HIERARCHY; found ${deHelpMatch.length}`,
  );
});

// Use the JournalEntry type so the fixture compiles even if the
// api.js JournalEntry shape changes upstream.
type _JournalEntryRef = JournalEntry;
