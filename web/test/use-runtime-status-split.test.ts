import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Block F (Performance & Bundle) regression gate for F2.
 *
 * F2: `useRuntimeStatus` is currently 619 lines. About half of it
 *     (`handleSaveOpenRouterCredentials`, `handleTestOpenRouterCredentials`,
 *     `handleSettingsVerifyConnection`, `handleIntegrationAction`,
 *     `buildSettingsIntegrationStartUrl`) is only consumed by
 *     `SettingsWorkspace`. F2 splits those callbacks into a new
 *     `useSettingsWorkspaceStatus` hook so the shell does not have to
 *     re-render on Settings-only state changes (and so the Settings
 *     prop type stops carrying ~8 callbacks through App.tsx).
 *
 * The split MUST:
 *   1. Stop exporting the 5 Settings-only callbacks as values from
 *      `useRuntimeStatus.ts`. (They were never `export function`s —
 *      they were returned from the hook — but the Settings-related
 *      Settings-only state slots must also disappear from the
 *      runtime-status return shape so App.tsx can no longer pull them
 *      off `useRuntimeStatus()`.)
 *   2. Create a new `useSettingsWorkspaceStatus.ts` hook that owns
 *      those 5 callbacks and the 7 Settings-only state slots
 *      (`openRouterApiKeyInput`, `setOpenRouterApiKeyInput`,
 *      `openRouterModelInput`, `setOpenRouterModelInput`,
 *      `isSavingOpenRouterCredentials`,
 *      `isTestingOpenRouterCredentials`,
 *      `openRouterCredentialMessage`,
 *      `settingsVerificationResults`).
 *   3. `App.tsx` must wire the new hook alongside `useRuntimeStatus`
 *      and pass the 5 callbacks through `settingsWorkspaceProps`.
 *   4. `SettingsWorkspace.tsx` must keep its prop type (the 5
 *      callbacks are passed in as props) — no behavioral change.
 *
 * The `SettingsVerificationState` and `SettingsVerificationTarget`
 *     types move to `web/src/lib/settings-types.ts`.
 *
 * Strategy: source-level assertions + an import-graph check.
 * Behaviour (state updates) is already covered by the existing
 * integration suite; this test guards the structural split.
 */

const runtimeStatusPath = "web/src/hooks/useRuntimeStatus.ts";
const settingsHookPath = "web/src/hooks/useSettingsWorkspaceStatus.ts";
const settingsTypesPath = "web/src/lib/settings-types.ts";
const appPath = "web/src/App.tsx";
const settingsWorkspacePath = "web/src/components/SettingsWorkspace.tsx";

function readRuntimeStatus() {
  return readFileSync(runtimeStatusPath, "utf8");
}

function readSettingsHook() {
  return readFileSync(settingsHookPath, "utf8");
}

function readSettingsTypes() {
  return readFileSync(settingsTypesPath, "utf8");
}

function readApp() {
  return readFileSync(appPath, "utf8");
}

function readSettingsWorkspace() {
  return readFileSync(settingsWorkspacePath, "utf8");
}

const SETTINGS_ONLY_STATE_SLOTS = [
  "openRouterApiKeyInput",
  "setOpenRouterApiKeyInput",
  "openRouterModelInput",
  "setOpenRouterModelInput",
  "isSavingOpenRouterCredentials",
  "isTestingOpenRouterCredentials",
  "openRouterCredentialMessage",
  "settingsVerificationResults",
];

const SETTINGS_ONLY_CALLBACKS = [
  "handleSaveOpenRouterCredentials",
  "handleTestOpenRouterCredentials",
  "handleSettingsVerifyConnection",
  "handleIntegrationAction",
  "buildSettingsIntegrationStartUrl",
];

// Map of SettingsWorkspace prop aliases. App.tsx renames the hook
// callbacks to these shorter prop names.
const SETTINGS_WORKSPACE_PROP_ALIASES: Record<(typeof SETTINGS_ONLY_CALLBACKS)[number], string[]> = {
  handleSaveOpenRouterCredentials: ["onSaveOpenRouterCredentials", "handleSaveOpenRouterCredentials"],
  handleTestOpenRouterCredentials: ["onTestOpenRouterCredentials", "handleTestOpenRouterCredentials"],
  handleSettingsVerifyConnection: ["onVerifyConnection", "handleSettingsVerifyConnection"],
  handleIntegrationAction: ["onIntegrationAction", "handleIntegrationAction"],
  buildSettingsIntegrationStartUrl: ["buildIntegrationStartUrl", "buildSettingsIntegrationStartUrl"],
};

test("F2: useRuntimeStatus no longer references the 5 Settings-only callbacks (they moved out of the file)", () => {
  const source = readRuntimeStatus();

  for (const callback of SETTINGS_ONLY_CALLBACKS) {
    assert.equal(
      new RegExp(`\\b${callback}\\b`).test(source),
      false,
      `useRuntimeStatus must no longer reference "${callback}" — it moved to useSettingsWorkspaceStatus`,
    );
  }
});

test("F2: useRuntimeStatus no longer declares the Settings-only state slots (openRouterApiKeyInput / set… / settingsVerificationResults / etc.)", () => {
  const source = readRuntimeStatus();

  for (const slot of SETTINGS_ONLY_STATE_SLOTS) {
    // Settings-only state slots must not be assigned via useState
    // inside useRuntimeStatus anymore. (They were `set…` setters from
    // useState — check for the slot name on a useState call.)
    const useStateLine = new RegExp(`useState[\\s\\S]{0,40}\\b${slot}\\b`, "m");
    assert.equal(
      useStateLine.test(source),
      false,
      `useRuntimeStatus must no longer useState(...) "${slot}" — it moved to useSettingsWorkspaceStatus`,
    );
  }
});

test("F2: useSettingsWorkspaceStatus.ts exists, is a hook, and exports the 5 Settings-only callbacks", () => {
  const source = readSettingsHook();

  // Must export a hook function.
  assert.match(
    source,
    /export\s+function\s+useSettingsWorkspaceStatus\b/,
    "useSettingsWorkspaceStatus.ts must export the `useSettingsWorkspaceStatus` hook function",
  );

  // The 5 callbacks must appear in the hook body so App.tsx can read
  // them off the return value.
  for (const callback of SETTINGS_ONLY_CALLBACKS) {
    assert.match(
      source,
      new RegExp(`\\b${callback}\\b`),
      `useSettingsWorkspaceStatus.ts must define "${callback}" inside the hook`,
    );
  }
});

test("F2: web/src/lib/settings-types.ts exists and declares SettingsVerificationState / SettingsVerificationTarget", () => {
  const source = readSettingsTypes();

  assert.match(
    source,
    /export\s+type\s+SettingsVerificationTarget\s*=\s*["']backend["']\s*\|\s*["']github["']\s*\|\s*["']matrix["']/,
    "settings-types.ts must export SettingsVerificationTarget = 'backend' | 'github' | 'matrix'",
  );
  assert.match(
    source,
    /export\s+type\s+SettingsVerificationState\b/,
    "settings-types.ts must export SettingsVerificationState",
  );
});

test("F2: App.tsx calls useSettingsWorkspaceStatus alongside useRuntimeStatus and threads the 5 callbacks into settingsWorkspaceProps", () => {
  const source = readApp();

  // Must import the new hook.
  assert.match(
    source,
    /import\s*\{[^}]*useSettingsWorkspaceStatus[^}]*\}\s*from\s*["'][^"']*useSettingsWorkspaceStatus/,
    "App.tsx must import useSettingsWorkspaceStatus",
  );

  // Must call the hook and destructure the 5 callbacks.
  assert.match(
    source,
    /useSettingsWorkspaceStatus\s*\(\s*\{/,
    "App.tsx must call useSettingsWorkspaceStatus({…})",
  );

  for (const callback of SETTINGS_ONLY_CALLBACKS) {
    assert.match(
      source,
      new RegExp(`\\b${callback}\\b`),
      `App.tsx must reference "${callback}" (it threads it into settingsWorkspaceProps)`,
    );
  }

  // Must keep using useRuntimeStatus for the shell-only state.
  assert.match(
    source,
    /useRuntimeStatus\s*\(\s*\{/,
    "App.tsx must still call useRuntimeStatus({…}) for the shell-only state",
  );
});

test("F2: SettingsWorkspace still receives the 5 callbacks as props (no behavioral change)", () => {
  const source = readSettingsWorkspace();

  // The SettingsWorkspace props type should still take the 5
  // callbacks. (This guarantees App.tsx threads them through.)
  for (const callback of SETTINGS_ONLY_CALLBACKS) {
    const aliases = SETTINGS_WORKSPACE_PROP_ALIASES[callback];
    const found = aliases.some((alias) => source.includes(alias));
    assert.ok(
      found,
      `SettingsWorkspace prop type must still reference a callback named "${callback}" (or one of its aliases: ${aliases.join(", ")})`,
    );
  }
});
