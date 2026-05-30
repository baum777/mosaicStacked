import assert from "node:assert/strict";
import test from "node:test";
import {
  applyQueueMatrixDraftCommand,
  applyOpenWorkbenchWithDraftCommand,
  type CrossTabCommand,
} from "../src/lib/cross-tab-commands.js";
import { createCrossTabCommandHandler } from "../src/hooks/useCrossTabCommands.js";
import { createDefaultWorkspaceState, type WorkspaceState } from "../src/lib/workspace-state.js";

test("OpenWorkbenchWithDraft writes pending draft before mode switch", () => {
  const order: string[] = [];
  let state: WorkspaceState = createDefaultWorkspaceState();
  let pinnedContext: unknown = null;

  const handler = createCrossTabCommandHandler({
    locale: "de",
    setMode: (mode) => {
      order.push(`setMode:${mode}`);
    },
    setWorkspaceState: (update) => {
      order.push("setWorkspaceState");
      state = typeof update === "function" ? update(state) : update;
      return state;
    },
    selectActiveWorkspaceSession: (workspace) => {
      order.push(`selectActive:${workspace}`);
    },
    setPinnedChatContext: (update) => {
      pinnedContext = typeof update === "function" ? update(pinnedContext as never) : update;
      return pinnedContext;
    },
    recordTelemetry: () => {},
  });

  const command: CrossTabCommand = {
    type: "OpenWorkbenchWithDraft",
    payload: {
      content: "Bitte analysiere die Routing-Strecke.",
      repo: "acme/widget",
      intent: "analysis",
      sourceMessageId: "msg-1",
    },
  };
  handler(command);

  assert.equal(order[0], "setWorkspaceState");
  assert.equal(order[1], "setMode:workbench");
  assert.equal(order[2], "selectActive:github");

  const githubSession = state.sessionsByWorkspace.github.find((session) => session.id === state.activeSessionIdByWorkspace.github);
  assert.ok(githubSession);
  assert.equal(githubSession.metadata.selectedRepoFullName, "acme/widget");
  assert.equal(githubSession.metadata.pendingDraft?.content, "Bitte analysiere die Routing-Strecke.");
  assert.equal(githubSession.metadata.pendingDraft?.intent, "analysis");
  assert.equal(githubSession.metadata.pendingDraft?.sourceMessageId, "msg-1");
});

test("applyOpenWorkbenchWithDraftCommand stores repo-compatible metadata fields", () => {
  const initial = createDefaultWorkspaceState();
  const next = applyOpenWorkbenchWithDraftCommand({
    state: initial,
    payload: {
      content: "Draft seed",
      repo: "acme/console",
      branch: "feature/draft",
      intent: "proposal",
    },
  });

  const githubSession = next.sessionsByWorkspace.github.find((session) => session.id === next.activeSessionIdByWorkspace.github);
  assert.ok(githubSession);
  assert.equal(githubSession.metadata.selectedRepoFullName, "acme/console");
  assert.equal(githubSession.metadata.pendingDraft?.repo, "acme/console");
  assert.equal(githubSession.metadata.pendingDraft?.branch, "feature/draft");
  assert.equal(githubSession.metadata.pendingDraft?.intent, "proposal");
});

test("QueueMatrixDraft normalizes hashtags before writing draft content", () => {
  const initial = createDefaultWorkspaceState();
  const next = applyQueueMatrixDraftCommand({
    state: initial,
    locale: "en",
    payload: {
      sourceMessageId: "msg-2",
      roomId: " !room:matrix.example ",
      content: " Ship the release note. ",
      tags: [" release ", "#review", "##audit", "#", "   "],
    },
  });

  const matrixSession = next.sessionsByWorkspace.matrix.find((session) => session.id === next.activeSessionIdByWorkspace.matrix);
  assert.ok(matrixSession);
  assert.equal(matrixSession.metadata.roomId, "!room:matrix.example");
  assert.equal(matrixSession.metadata.draftContent, "Ship the release note.\n\n#release #review #audit");
  assert.doesNotMatch(matrixSession.metadata.draftContent, /##/);
  assert.doesNotMatch(matrixSession.metadata.draftContent, /(?:^|\s)#(?:\s|$)/);
});
