import assert from "node:assert/strict";
import test from "node:test";
import { buildCompanionContext, type CompanionContext } from "../src/lib/companion-context.js";

const FORBIDDEN_SECRET_FRAGMENTS = [
  "must-not-leak",
  "apiKey",
  "secret",
  "token",
  "cookie",
  "provider",
  "target"
];

function buildFixture() {
  return {
    workspace: "settings" as const,
    workMode: "beginner" as const,
    freshness: "backend-fresh" as const,
    backendHealthy: true,
    activeModelAlias: "default-free",
    integrationsStatus: {
      ok: true as const,
      generatedAt: "2026-05-16T00:00:00.000Z",
      github: {
        status: "connected",
        credentialSource: "user_connected",
        capabilities: {
          read: "available",
          propose: "available",
          execute: "approval_required",
          verify: "available"
        },
        executionMode: "approval_required",
        labels: {
          identity: "user",
          scope: "repo"
        },
        lastVerifiedAt: null,
        lastErrorCode: null,
        apiKey: "must-not-leak",
        secret: "must-not-leak",
        token: "must-not-leak",
        cookie: "must-not-leak",
        provider: "must-not-leak",
        target: "must-not-leak",
        matrixHomeserverToken: "must-not-leak"
      },
      matrix: {
        status: "connected",
        credentialSource: "user_connected",
        capabilities: {
          read: "available",
          propose: "blocked",
          execute: "approval_required",
          verify: "unknown"
        },
        executionMode: "approval_required",
        labels: {
          identity: "matrix",
          scope: "rooms"
        },
        lastVerifiedAt: null,
        lastErrorCode: null,
        apiKey: "must-not-leak",
        secret: "must-not-leak",
        token: "must-not-leak",
        cookie: "must-not-leak",
        provider: "must-not-leak",
        target: "must-not-leak",
        matrixHomeserverToken: "must-not-leak"
      }
    },
    runtimeJournalEntries: [
      {
        id: "journal-1",
        timestamp: "2026-05-16T00:00:00.000Z",
        source: "chat",
        eventType: "reply",
        authorityDomain: "backend",
        severity: "info",
        outcome: "observed",
        summary: "Chat answered",
        correlationId: null,
        proposalId: null,
        planId: null,
        executionId: null,
        verificationId: null,
        modelRouteSummary: { selectedAlias: "default-free" },
        safeMetadata: {
          apiKey: "must-not-leak",
          secret: "must-not-leak",
          token: "must-not-leak",
          matrixHomeserverToken: "must-not-leak"
        },
        redaction: {
          contentStored: false,
          secretsStored: false,
          filteredKeys: ["apiKey", "matrixHomeserverToken"]
        }
      }
    ],
    chatSession: {
      metadata: {
        chatState: {
          messages: [
            { id: "m1", role: "user", content: "do not include full content" },
            { id: "m2", role: "assistant", content: "do not include assistant content" }
          ],
          connectionState: "idle",
          pendingProposal: null,
          receipts: []
        }
      }
    },
    githubSession: {
      metadata: {
        selectedRepoFullName: "baum777/mosaicStacked",
        proposalPlan: null,
        pendingDraft: {
          id: "draft-1",
          content: "do not include draft",
          intent: "context",
          repo: "baum777/mosaicStacked",
          createdAt: "2026-05-16T08:00:00.000Z"
        }
      }
    },
    matrixSession: {
      metadata: {
        roomId: "!room:example.org",
        roomName: "Mosaic",
        draftContent: "do not include matrix draft"
      }
    }
  };
}

function collectKeys(value: unknown, prefix = ""): string[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectKeys(entry, prefix));
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      return [nextPrefix, ...collectKeys(entry, nextPrefix)];
    });
  }

  return [];
}

test("buildCompanionContext never serializes any of the forbidden secret fragments", () => {
  const context: CompanionContext = buildCompanionContext(buildFixture());
  const serialized = JSON.stringify(context);

  for (const fragment of FORBIDDEN_SECRET_FRAGMENTS) {
    assert.equal(
      serialized.includes(fragment),
      false,
      `serialized CompanionContext must not contain "${fragment}" but did: ${serialized}`
    );
  }
});

test("buildCompanionContext never serializes message/draft content from chat, github, or matrix sessions", () => {
  const context: CompanionContext = buildCompanionContext(buildFixture());
  const serialized = JSON.stringify(context);

  assert.equal(serialized.includes("do not include full content"), false);
  assert.equal(serialized.includes("do not include assistant content"), false);
  assert.equal(serialized.includes("do not include draft"), false);
  assert.equal(serialized.includes("do not include matrix draft"), false);
});

test("buildCompanionContext output keys are a strict subset of the documented allowlist", () => {
  const context: CompanionContext = buildCompanionContext(buildFixture());
  const keys = new Set(collectKeys(context));

  // Documented allowlist mirrors the CompanionContext type shape.
  // Adding a new key to the type must be matched here.
  const allowlist = new Set<string>([
    "workspace",
    "workMode",
    "freshness",
    "backend",
    "backend.healthy",
    "model",
    "model.publicAlias",
    "integrations",
    "integrations.github",
    "integrations.matrix",
    "integrations.github",
    "integrations.matrix",
    "integrations.github.status",
    "integrations.github.credentialSource",
    "integrations.github.executionMode",
    "integrations.github.read",
    "integrations.github.propose",
    "integrations.github.execute",
    "integrations.github.verify",
    "integrations.github.identityLabel",
    "integrations.github.scopeLabel",
    "integrations.github.lastVerifiedAt",
    "integrations.github.lastErrorCode",
    "integrations.matrix.status",
    "integrations.matrix.credentialSource",
    "integrations.matrix.executionMode",
    "integrations.matrix.read",
    "integrations.matrix.propose",
    "integrations.matrix.execute",
    "integrations.matrix.verify",
    "integrations.matrix.identityLabel",
    "integrations.matrix.scopeLabel",
    "integrations.matrix.lastVerifiedAt",
    "integrations.matrix.lastErrorCode",
    "sessions",
    "sessions.chat",
    "sessions.github",
    "sessions.matrix",
    "sessions.chat.connectionState",
    "sessions.chat.messageCount",
    "sessions.chat.pendingProposalStatus",
    "sessions.chat.receiptCount",
    "sessions.github.selectedRepoFullName",
    "sessions.github.hasPendingDraft",
    "sessions.github.hasAnalysisBundle",
    "sessions.github.hasProposalPlan",
    "sessions.github.approvalChecked",
    "sessions.github.hasExecutionResult",
    "sessions.github.hasVerificationResult",
    "sessions.matrix.roomId",
    "sessions.matrix.roomName",
    "sessions.matrix.selectedRoomCount",
    "sessions.matrix.selectedSpaceCount",
    "sessions.matrix.hasScope",
    "sessions.matrix.hasScopeSummary",
    "sessions.matrix.approvalPending",
    "sessions.matrix.hasDraft",
    "sessions.matrix.lastActionResult",
    "journal",
    "journal.source",
    "journal.eventType",
    "journal.severity",
    "journal.outcome",
    "journal.summary",
    "journal.timestamp",
    "journal.selectedAlias"
  ]);

  for (const key of keys) {
    assert.equal(
      allowlist.has(key),
      true,
      `key "${key}" leaked into CompanionContext but is not in the documented allowlist`
    );
  }
});

test("buildCompanionContext journal entries are sanitized: selectedAlias only, no safeMetadata or full redaction block", () => {
  const context: CompanionContext = buildCompanionContext(buildFixture());
  const serialized = JSON.stringify(context);

  // The redaction block and safeMetadata must not bleed into the context.
  assert.equal(serialized.includes("safeMetadata"), false);
  assert.equal(serialized.includes("filteredKeys"), false);
  assert.equal(serialized.includes("secretsStored"), false);
  assert.equal(serialized.includes("correlationId"), false);
  assert.equal(serialized.includes("planId"), false);
  assert.equal(serialized.includes("executionId"), false);
});
