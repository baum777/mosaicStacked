import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CommunityWorkspace, buildCommunityRoomCards } from "../src/components/CommunityWorkspace.js";
import { EvidenceWorkspace, buildEvidenceTimeline } from "../src/components/EvidenceWorkspace.js";
import { ModelsWorkspace, buildProviderHealthRows } from "../src/components/ModelsWorkspace.js";
import { ReviewWorkspace, type ReviewItem } from "../src/components/ReviewWorkspace.js";
import { LocaleProvider } from "../src/lib/localization.js";
import type { JournalEntry } from "../src/lib/api.js";
import type { MatrixSession } from "../src/lib/workspace-state.js";

const now = "2026-06-18T12:00:00.000Z";

function renderWithLocale(node: React.ReactNode, locale: "en" | "de" = "en") {
  return renderToStaticMarkup(
    React.createElement(LocaleProvider, { initialLocale: locale }, node),
  );
}

test("Review workspace exposes approval and rejection intent without executing in the browser", () => {
  const items: ReviewItem[] = [{
    id: "plan-1",
    source: "github",
    title: "Update settings panel",
    summary: "Requires backend-owned approval before execution.",
    status: "pending_review",
    sourceLabel: "Workbench",
    provenanceRows: [{ label: "Plan", value: "plan-1" }],
  }];

  const markup = renderWithLocale(
    React.createElement(ReviewWorkspace, {
      items,
      expertMode: true,
      workMode: "expert",
      locale: "en",
      onTelemetry: () => undefined,
      onNavigateToWorkspace: () => undefined,
    }),
  );

  assert.match(markup, /Approve intent/);
  assert.match(markup, /Reject intent/);
  assert.match(markup, /Open Workbench/);
  assert.match(markup, /Open Evidence/);
  assert.match(markup, /Backend execution stays in the originating workspace/);
});

test("Community workspace builds read-only Matrix discovery cards from session metadata", () => {
  const session = {
    metadata: {
      selectedRoomIds: ["!alpha:matrix.example", "!beta:matrix.example"],
      selectedSpaceIds: ["#governance:matrix.example"],
      roomId: "!active:matrix.example",
      roomName: "Governance Room",
      topicRoomId: "!topic:matrix.example",
      provenanceRoomId: "!evidence:matrix.example",
    },
  } as MatrixSession;

  const rooms = buildCommunityRoomCards({
    matrixSession: session,
    landingRoomId: "!landing:matrix.example",
  });

  assert.equal(rooms.length, 7);
  assert.equal(rooms[0]?.id, "!active:matrix.example");

  const markup = renderWithLocale(
    React.createElement(CommunityWorkspace, {
      matrixSession: session,
      matrixReadAvailable: true,
      workMode: "beginner",
      expertMode: false,
      locale: "en",
      onTelemetry: () => undefined,
      onQueueChatDraft: () => undefined,
      landingRoomId: "!landing:matrix.example",
      onNavigateToWorkspace: () => undefined,
    }),
  );

  assert.match(markup, /Read-only Matrix discovery/);
  assert.match(markup, /Governance Room/);
  assert.match(markup, /Ask Community/);
  assert.match(markup, /Open Matrix/);
});

test("Models workspace summarizes active alias, registry capabilities, and provider health", () => {
  const rows = buildProviderHealthRows({
    activeModelAlias: "default-free",
    availableModels: ["default-free"],
    modelRegistry: [{
      alias: "default-free",
      label: "Default Free",
      description: "Free fallback route",
      capabilities: ["chat", "streaming"],
      tier: "fallback",
      streaming: true,
      recommendedFor: ["drafting"],
      default: true,
      available: true,
    }],
    integrationsStatus: {
      ok: true,
      generatedAt: now,
      github: null,
      matrix: null,
    } as never,
  });

  assert.equal(rows[0]?.alias, "default-free");
  assert.equal(rows[0]?.status, "online");

  const markup = renderWithLocale(
    React.createElement(ModelsWorkspace, {
      activeModelAlias: "default-free",
      availableModels: ["default-free"],
      modelRegistry: rows.map((row) => row.model),
      routingStatus: { fallbackAllowed: true },
      runtimeDiagnostics: null,
      integrationsStatus: null,
      workMode: "expert",
      expertMode: true,
      locale: "en",
      onTelemetry: () => undefined,
      onNavigateToWorkspace: () => undefined,
    }),
  );

  assert.match(markup, /Active model/);
  assert.match(markup, /Default Free/);
  assert.match(markup, /Fallback allowed/);
  assert.match(markup, /Switch in Chat/);
});

test("Evidence workspace merges journal and diagnostics into a filterable timeline", () => {
  const journalEntries: JournalEntry[] = [{
    id: "journal-1",
    timestamp: now,
    source: "github",
    eventType: "approval",
    authorityDomain: "backend",
    severity: "info",
    outcome: "accepted",
    summary: "Approval intent accepted",
    correlationId: "corr-1",
    proposalId: null,
    planId: "plan-1",
    executionId: null,
    verificationId: null,
    modelRouteSummary: null,
    safeMetadata: { route: "/api/github/actions/plan-1/execute" },
    redaction: {
      contentStored: false,
      secretsStored: false,
      filteredKeys: [],
    },
  }];

  const timeline = buildEvidenceTimeline({
    journalEntries,
    diagnostics: [{ kind: "info", label: "Local check", detail: "Rendered workspace", timestamp: now }],
  });

  assert.equal(timeline.length, 2);
  assert.equal(timeline[0]?.kind, "decision");

  const markup = renderWithLocale(
    React.createElement(EvidenceWorkspace, {
      journalEntries,
      diagnostics: timeline.slice(1).map((entry) => ({
        kind: "info" as const,
        label: entry.summary,
        detail: entry.detail,
        timestamp: entry.timestamp,
      })),
      runtimeDiagnostics: null,
      settingsTruthSnapshot: null,
      workMode: "expert",
      expertMode: true,
      locale: "en",
      onTelemetry: () => undefined,
      onClearDiagnostics: () => undefined,
      onNavigateToWorkspace: () => undefined,
    }),
  );

  assert.match(markup, /Evidence Log/);
  assert.match(markup, /Approval intent accepted/);
  assert.match(markup, /Export JSON/);
  assert.match(markup, /Open Workbench/);
});
