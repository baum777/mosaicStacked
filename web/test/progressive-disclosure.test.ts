import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/**
 * Slice 5: Progressive disclosure per tab.
 *
 * Beginner mode shows fewer expert-only surfaces than expert mode. The
 * primary goal of this regression gate is to ensure the rendering paths
 * stay wired to `workMode === "expert"` (or `expertMode`), not hard-coded
 * `true`. The assertions here are source-level so they survive refactors
 * that move code between files but do not change the gating logic.
 */

const chatSource = () => readFileSync("web/src/components/ChatWorkspace.tsx", "utf8");
const settingsSource = () => readFileSync("web/src/components/SettingsWorkspace.tsx", "utf8");
const githubSource = () => readFileSync("web/src/components/GitHubWorkspace.tsx", "utf8");
const matrixSource = () => readFileSync("web/src/components/MatrixWorkspace.tsx", "utf8");
const perfSource = () => readFileSync("web/src/components/PerformanceWorkspace.tsx", "utf8");

test("ChatWorkspace expertMode-gates the receipt card", () => {
  const source = chatSource();
  // The map call that renders <ExecutionReceiptCard ...> must be wrapped
  // in an expertMode ? (...) : null ternary so beginner mode never sees
  // a chat-receipt-* test-id in the DOM.
  const index = source.indexOf("chatState.receipts.map((receipt) => (");
  assert.ok(index >= 0, "expected the chatState.receipts.map call");
  const window = source.slice(index, index + 240);
  assert.match(
    window,
    /expertMode\s*\?\s*\(/,
    "ExecutionReceiptCard must be wrapped in an expertMode ternary",
  );
});

test("ChatWorkspace keeps the proposal card visible in beginner mode as the primary next step", () => {
  // The proposal card is the primary next-action card; it must stay
  // visible in beginner mode. Only governance details (request ids,
  // route status, raw diffs) hide behind expertMode.
  const source = chatSource();
  const index = source.indexOf('testId="chat-proposal-card"');
  assert.ok(index >= 0, "expected chat-proposal-card testId");
  const window = source.slice(Math.max(0, index - 400), index);
  assert.match(
    window,
    /pendingProposal\?\.status === "pending"/,
    "ProposalCard outer condition must keep checking pendingProposal status",
  );
});

test("SettingsWorkspace wizard appears before diagnostics in JSX render order", () => {
  // Compare render-order: the wizard JSX must come before the
  // diagnosticsCardTitle JSX in the source file. The check must look at
  // a JSX-render location, not at the localization string definition.
  const source = settingsSource();
  const wizardRender = source.indexOf('data-testid="settings-wizard"');
  const diagnosticsRender = source.indexOf('{ui.settings.diagnosticsCardTitle}');
  assert.ok(wizardRender >= 0, "expected settings-wizard test-id");
  assert.ok(diagnosticsRender >= 0, "expected diagnosticsCardTitle JSX");
  assert.ok(wizardRender < diagnosticsRender, "wizard must come before diagnostics");
});

test("SettingsWorkspace wizard carries the localized setup-step test-ids", () => {
  const source = settingsSource();
  for (const id of [
    "settings-setup-step-backend",
    "settings-setup-step-model",
    "settings-setup-step-chat",
    "settings-setup-step-github",
    "settings-setup-step-matrix",
  ]) {
    assert.match(source, new RegExp(`testId: "${id}"`), `${id} must be defined`);
  }
});

test("GitHubWorkspace still honors the no-repo-only path", () => {
  const source = githubSource();
  assert.match(
    source,
    /showRepoSelectionOnly|noRepoSelected/,
    "GitHubWorkspace must keep a no-repo branch",
  );
});

test("MatrixWorkspace still exposes a fail-closed composer path", () => {
  const source = matrixSource();
  assert.match(source, /submitFailClosed/, "matrix composer must stay fail-closed");
  assert.match(source, /showMatrixConnectionEmptyState/, "matrix empty-state must exist");
});

test("PerformanceWorkspace separates backend status from local evidence", () => {
  const source = perfSource();
  assert.match(
    source,
    /performance-backend-card/,
    "Performance must render a backend status card",
  );
  assert.match(
    source,
    /data-testid="performance-backend-summary"/,
    "Performance must render a backend status summary line",
  );
});
