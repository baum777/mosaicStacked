import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeRoomTopicUpdate,
  executeRoomTopicUpdate,
  fetchJoinedRooms,
  fetchMatrixWhoAmI,
  fetchPlan,
  fetchProvenance,
  fetchRoomHierarchy,
  fetchRoomTopicAnalysisPlan,
  fetchRoomTopicUpdatePlan,
  fetchScopeSummary,
  MatrixRequestError,
  verifyRoomTopicUpdate
} from "../src/lib/matrix-api.js";

function installFetchMock(handler: typeof fetch) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = handler;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

test("matrix whoami rejects malformed 200 payloads", async () => {
  const restoreFetch = installFetchMock(async () =>
    new Response(
      JSON.stringify({
        ok: true,
        deviceId: null,
        homeserver: "matrix.example"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )
  );

  try {
    await assert.rejects(
      fetchMatrixWhoAmI(),
      (error) =>
        error instanceof MatrixRequestError
        && error.kind === "parse"
        && error.operation === "Matrix whoami"
        && error.message.includes("userId")
    );
  } finally {
    restoreFetch();
  }
});

test("matrix room topic analysis validates structured plan payloads", async () => {
  const seenRequests: Array<{ url: string; method: string }> = [];
  const restoreFetch = installFetchMock(async (input, init) => {
    const requestUrl = typeof input === "string" ? input : input.url;
    seenRequests.push({
      url: requestUrl,
      method: init?.method ?? "GET"
    });

    return new Response(
      JSON.stringify({
        ok: true,
        plan: {
          planId: "plan-1",
          roomId: "!room:example",
          scopeId: null,
          snapshotId: null,
          status: "pending_review",
          actions: [
            {
              type: "set_room_topic",
              roomId: "!room:example",
              currentValue: "Old topic",
              proposedValue: "New topic"
            }
          ],
          currentValue: "Old topic",
          proposedValue: "New topic",
          risk: "medium",
          requiresApproval: true,
          createdAt: "2026-04-16T10:00:00.000Z",
          expiresAt: "2026-04-16T10:10:00.000Z"
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  });

  try {
    const plan = await analyzeRoomTopicUpdate({
      roomId: "!room:example",
      proposedValue: "New topic"
    });

    assert.equal(plan.roomId, "!room:example");
    assert.equal(plan.actions[0]?.type, "set_room_topic");
    assert.equal(plan.proposedValue, "New topic");
    assert.equal(new URL(seenRequests[0]?.url ?? "http://127.0.0.1").pathname, "/api/matrix/analyze");
    assert.deepEqual(seenRequests.map((request) => request.method), ["POST"]);
  } finally {
    restoreFetch();
  }
});

test("matrix room topic analysis rejects malformed actions in fetched plans", async () => {
  const restoreFetch = installFetchMock(async () =>
    new Response(
      JSON.stringify({
        ok: true,
        plan: {
          planId: "plan-1",
          roomId: "!room:example",
          scopeId: null,
          snapshotId: null,
          status: "pending_review",
          actions: [
            {
              type: "set_room_topic",
              roomId: "!room:example",
              currentValue: "Old topic"
            }
          ],
          currentValue: "Old topic",
          proposedValue: "New topic",
          risk: "medium",
          requiresApproval: true,
          createdAt: "2026-04-16T10:00:00.000Z",
          expiresAt: "2026-04-16T10:10:00.000Z"
        }
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )
  );

  try {
    await assert.rejects(
      fetchRoomTopicAnalysisPlan("plan-1"),
      (error) =>
        error instanceof MatrixRequestError
        && error.kind === "parse"
        && error.operation === "Matrix room topic analysis plan fetch"
        && error.message.includes("proposedValue")
    );
  } finally {
    restoreFetch();
  }
});

test("matrix provenance requests the encoded room route and validates the read-only response", async () => {
  const seenRequests: Array<{ url: string; method: string }> = [];
  const restoreFetch = installFetchMock(async (input, init) => {
    const requestUrl = typeof input === "string" ? input : input.url;
    seenRequests.push({
      url: requestUrl,
      method: init?.method ?? "GET"
    });

    return new Response(
      JSON.stringify({
        ok: true,
        roomId: "!room:matrix.example",
        snapshotId: null,
        stateEventId: null,
        originServer: "https://matrix.example",
        authChainIndex: 0,
        signatures: [
          {
            signer: "@user:matrix.example",
            status: "derived"
          }
        ],
        integrityNotice: "Read-only room metadata derived from joined rooms."
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  });

  try {
    const response = await fetchProvenance("!room:matrix.example");
    const parsedUrl = new URL(seenRequests[0]?.url ?? "http://127.0.0.1");

    assert.equal(response.ok, true);
    assert.equal(response.roomId, "!room:matrix.example");
    assert.equal(response.originServer, "https://matrix.example");
    assert.equal(response.integrityNotice, "Read-only room metadata derived from joined rooms.");
    assert.equal(response.signatures[0]?.status, "derived");
    assert.deepEqual(seenRequests.map((request) => request.method), ["GET"]);
    assert.equal(parsedUrl.pathname, "/api/matrix/rooms/!room%3Amatrix.example/provenance");
  } finally {
    restoreFetch();
  }
});

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

async function assertRejectsParse(
  trigger: () => Promise<unknown>,
  expectedMessageFragment: string
) {
  await assert.rejects(
    trigger(),
    (error) =>
      error instanceof MatrixRequestError
      && error.kind === "parse"
      && error.message.includes(expectedMessageFragment),
    `expected MatrixRequestError kind=parse with message containing "${expectedMessageFragment}"`
  );
}

test("validateJoinedRoomsResponse: happy + missing ok + wrong type + non-array rooms", async () => {
  const happy = {
    ok: true,
    rooms: [
      {
        roomId: "!room:example",
        name: "Example",
        canonicalAlias: "#example:example",
        roomType: "m.room"
      }
    ]
  };

  // Happy
  {
    const restore = installFetchMock(async () => jsonResponse(happy));
    try {
      const rooms = await fetchJoinedRooms();
      assert.equal(rooms.length, 1);
      assert.equal(rooms[0]?.roomId, "!room:example");
    } finally {
      restore();
    }
  }

  // Missing ok
  {
    const restore = installFetchMock(async () => jsonResponse({ rooms: [] }));
    try {
      await assertRejectsParse(() => fetchJoinedRooms(), "ok");
    } finally {
      restore();
    }
  }

  // Wrong type for ok
  {
    const restore = installFetchMock(async () => jsonResponse({ ok: "yes", rooms: [] }));
    try {
      await assertRejectsParse(() => fetchJoinedRooms(), "ok");
    } finally {
      restore();
    }
  }

  // Wrong type for rooms
  {
    const restore = installFetchMock(async () => jsonResponse({ ok: true, rooms: "nope" }));
    try {
      await assertRejectsParse(() => fetchJoinedRooms(), "rooms");
    } finally {
      restore();
    }
  }
});

test("validateSpaceHierarchyResponse: happy + missing ok + wrong type + non-array rooms", async () => {
  const happy = {
    ok: true,
    spaceId: "!space:example",
    rooms: [
      { room_id: "!r:example", name: "R", canonical_alias: "#r:example", room_type: "m.room" }
    ]
  };

  {
    const restore = installFetchMock(async () => jsonResponse(happy));
    try {
      const result = await fetchRoomHierarchy("!space:example");
      assert.equal(result.ok, true);
      assert.equal(result.spaceId, "!space:example");
      assert.equal(result.rooms?.[0]?.room_id, "!r:example");
    } finally {
      restore();
    }
  }

  {
    const restore = installFetchMock(async () => jsonResponse({ spaceId: "!space:example" }));
    try {
      await assertRejectsParse(() => fetchRoomHierarchy("!space:example"), "ok");
    } finally {
      restore();
    }
  }

  {
    const restore = installFetchMock(async () => jsonResponse({ ok: "true", spaceId: "!space:example" }));
    try {
      await assertRejectsParse(() => fetchRoomHierarchy("!space:example"), "ok");
    } finally {
      restore();
    }
  }

  {
    const restore = installFetchMock(async () => jsonResponse({ ok: true, spaceId: "!space:example", rooms: "nope" }));
    try {
      await assertRejectsParse(() => fetchRoomHierarchy("!space:example"), "rooms");
    } finally {
      restore();
    }
  }
});

test("validateScopeSummaryResponse: happy + missing ok + wrong type + wrong enum selected", async () => {
  const happy = {
    ok: true,
    scopeId: "scope-1",
    snapshotId: "snapshot-1",
    generatedAt: "2026-04-21T08:00:00.000Z",
    items: [
      {
        roomId: "!r:example",
        name: "R",
        canonicalAlias: "#r:example",
        members: 3,
        freshnessMs: 1200,
        lastEventSummary: "Last seen",
        selected: true
      }
    ]
  };

  {
    const restore = installFetchMock(async () => jsonResponse(happy));
    try {
      const result = await fetchScopeSummary("scope-1");
      assert.equal(result.scopeId, "scope-1");
      assert.equal(result.items[0]?.roomId, "!r:example");
      assert.equal(result.items[0]?.selected, true);
    } finally {
      restore();
    }
  }

  {
    const restore = installFetchMock(async () => jsonResponse({
      scopeId: "scope-1", snapshotId: "snapshot-1", generatedAt: "2026-04-21T08:00:00.000Z", items: []
    }));
    try {
      await assertRejectsParse(() => fetchScopeSummary("scope-1"), "ok");
    } finally {
      restore();
    }
  }

  {
    const restore = installFetchMock(async () => jsonResponse({ ok: "true", scopeId: "scope-1", snapshotId: "snapshot-1", generatedAt: "2026-04-21T08:00:00.000Z", items: [] }));
    try {
      await assertRejectsParse(() => fetchScopeSummary("scope-1"), "ok");
    } finally {
      restore();
    }
  }

  {
    const restore = installFetchMock(async () => jsonResponse({
      ok: true,
      scopeId: "scope-1",
      snapshotId: "snapshot-1",
      generatedAt: "2026-04-21T08:00:00.000Z",
      items: [
        {
          roomId: "!r:example",
          name: "R",
          canonicalAlias: "#r:example",
          members: 3,
          freshnessMs: 1200,
          lastEventSummary: "Last seen",
          selected: "yes"
        }
      ]
    }));
    try {
      await assertRejectsParse(() => fetchScopeSummary("scope-1"), "selected");
    } finally {
      restore();
    }
  }
});

test("validatePlanResponse: happy + missing planId + wrong type + wrong enum riskLevel", async () => {
  const happy = {
    planId: "plan-1",
    type: "set_room_topic",
    targetRoomId: "!r:example",
    summary: "summary",
    rationale: "rationale",
    requiredApproval: true,
    stale: false,
    payloadDelta: { before: { topic: "old" }, after: { topic: "new" } },
    impactSummary: ["impact-1"],
    riskLevel: "low_surface",
    expectedPermissions: ["perm"],
    authorizationRequirements: ["auth"],
    preflightStatus: "passed",
    snapshotId: "snap-1",
    scopeId: "scope-1"
  };

  {
    const restore = installFetchMock(async () => jsonResponse({ ok: true, plan: happy }));
    try {
      const plan = await fetchPlan("plan-1");
      assert.equal(plan.planId, "plan-1");
      assert.equal(plan.riskLevel, "low_surface");
    } finally {
      restore();
    }
  }

  {
    const mutate = { ...happy };
    delete (mutate as Record<string, unknown>).planId;
    const restore = installFetchMock(async () => jsonResponse({ ok: true, plan: mutate }));
    try {
      await assertRejectsParse(() => fetchPlan("plan-1"), "planId");
    } finally {
      restore();
    }
  }

  {
    const mutate = { ...happy, requiredApproval: false };
    const restore = installFetchMock(async () => jsonResponse({ ok: true, plan: mutate }));
    try {
      await assertRejectsParse(() => fetchPlan("plan-1"), "requiredApproval");
    } finally {
      restore();
    }
  }

  {
    const mutate = { ...happy, riskLevel: "extreme" };
    const restore = installFetchMock(async () => jsonResponse({ ok: true, plan: mutate }));
    try {
      await assertRejectsParse(() => fetchPlan("plan-1"), "riskLevel");
    } finally {
      restore();
    }
  }
});

test("validateRoomTopicPlanResponse: happy + missing plan + wrong status enum + wrong type", async () => {
  const happy = {
    ok: true,
    plan: {
      planId: "plan-topic-1",
      type: "update_room_topic",
      roomId: "!r:example",
      status: "pending_review",
      createdAt: "2026-04-21T08:00:00.000Z",
      expiresAt: "2026-04-21T08:10:00.000Z",
      diff: { field: "topic", before: "old", after: "new" },
      requiresApproval: true
    }
  };

  {
    const restore = installFetchMock(async () => jsonResponse(happy));
    try {
      const plan = await fetchRoomTopicUpdatePlan("plan-topic-1");
      assert.equal(plan.planId, "plan-topic-1");
      assert.equal(plan.status, "pending_review");
    } finally {
      restore();
    }
  }

  {
    const restore = installFetchMock(async () => jsonResponse({ ok: true }));
    try {
      await assertRejectsParse(() => fetchRoomTopicUpdatePlan("plan-topic-1"), "plan");
    } finally {
      restore();
    }
  }

  {
    const mutate = {
      ...happy,
      plan: { ...happy.plan, status: "approved" }
    };
    const restore = installFetchMock(async () => jsonResponse(mutate));
    try {
      await assertRejectsParse(() => fetchRoomTopicUpdatePlan("plan-topic-1"), "status");
    } finally {
      restore();
    }
  }

  {
    const mutate = {
      ...happy,
      plan: { ...happy.plan, type: 123 }
    };
    const restore = installFetchMock(async () => jsonResponse(mutate));
    try {
      await assertRejectsParse(() => fetchRoomTopicUpdatePlan("plan-topic-1"), "type");
    } finally {
      restore();
    }
  }
});

test("validateRoomTopicExecutionResponse: happy + missing result + wrong enum status + wrong type", async () => {
  const happy = {
    ok: true,
    result: {
      planId: "plan-topic-1",
      status: "executed",
      executedAt: "2026-04-21T08:05:00.000Z",
      transactionId: "tx-1"
    }
  };

  {
    const restore = installFetchMock(async () => jsonResponse(happy));
    try {
      const result = await executeRoomTopicUpdate({ planId: "plan-topic-1", approval: true });
      assert.equal(result.planId, "plan-topic-1");
      assert.equal(result.status, "executed");
    } finally {
      restore();
    }
  }

  {
    const restore = installFetchMock(async () => jsonResponse({ ok: true }));
    try {
      await assertRejectsParse(() => executeRoomTopicUpdate({ planId: "plan-topic-1", approval: true }), "result");
    } finally {
      restore();
    }
  }

  {
    const mutate = {
      ...happy,
      result: { ...happy.result, status: "partial" }
    };
    const restore = installFetchMock(async () => jsonResponse(mutate));
    try {
      await assertRejectsParse(() => executeRoomTopicUpdate({ planId: "plan-topic-1", approval: true }), "status");
    } finally {
      restore();
    }
  }

  {
    const mutate = {
      ...happy,
      result: { ...happy.result, transactionId: 42 }
    };
    const restore = installFetchMock(async () => jsonResponse(mutate));
    try {
      await assertRejectsParse(() => executeRoomTopicUpdate({ planId: "plan-topic-1", approval: true }), "transactionId");
    } finally {
      restore();
    }
  }
});

test("validateRoomTopicVerificationResponse: happy + missing verification + wrong enum status + wrong type", async () => {
  const happy = {
    ok: true,
    verification: {
      planId: "plan-topic-1",
      status: "verified",
      checkedAt: "2026-04-21T08:06:00.000Z",
      expected: "new",
      actual: "new"
    }
  };

  {
    const restore = installFetchMock(async () => jsonResponse(happy));
    try {
      const result = await verifyRoomTopicUpdate("plan-topic-1");
      assert.equal(result.planId, "plan-topic-1");
      assert.equal(result.status, "verified");
      assert.equal(result.actual, "new");
    } finally {
      restore();
    }
  }

  {
    const restore = installFetchMock(async () => jsonResponse({ ok: true }));
    try {
      await assertRejectsParse(() => verifyRoomTopicUpdate("plan-topic-1"), "verification");
    } finally {
      restore();
    }
  }

  {
    const mutate = {
      ...happy,
      verification: { ...happy.verification, status: "approved" }
    };
    const restore = installFetchMock(async () => jsonResponse(mutate));
    try {
      await assertRejectsParse(() => verifyRoomTopicUpdate("plan-topic-1"), "status");
    } finally {
      restore();
    }
  }

  {
    const mutate = {
      ...happy,
      verification: { ...happy.verification, checkedAt: 12345 }
    };
    const restore = installFetchMock(async () => jsonResponse(mutate));
    try {
      await assertRejectsParse(() => verifyRoomTopicUpdate("plan-topic-1"), "checkedAt");
    } finally {
      restore();
    }
  }
});
