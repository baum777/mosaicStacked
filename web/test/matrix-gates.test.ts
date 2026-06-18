import assert from "node:assert/strict";
import test from "node:test";
import { canApproveTopicUpdateExecution, computeMatrixGates } from "../src/lib/matrix-gates.js";

const pendingReviewTopicPlan = {
  planId: "plan-topic-1",
  roomId: "!room:matrix.example",
  scopeId: null,
  snapshotId: null,
  status: "pending_review" as const,
  actions: [
    {
      type: "set_room_topic" as const,
      roomId: "!room:matrix.example",
      currentValue: "Old topic",
      proposedValue: "New topic"
    }
  ],
  currentValue: "Old topic",
  proposedValue: "New topic",
  risk: "low" as const,
  requiresApproval: true as const,
  createdAt: "2026-04-16T10:00:00.000Z",
  expiresAt: "2026-04-16T10:10:00.000Z"
};

test("matrix topic-update gate stays closed unless approval, freshness, and a pending review plan are present", () => {
  assert.equal(
    canApproveTopicUpdateExecution({
      approvalPending: false,
      executionLoading: false,
      executionResult: null,
      planRefreshError: null,
      planRefreshLoading: false,
      topicPlan: null,
      stalePlanDetected: false
    }),
    false
  );

  assert.equal(
    canApproveTopicUpdateExecution({
      approvalPending: true,
      executionLoading: false,
      executionResult: null,
      planRefreshError: null,
      planRefreshLoading: false,
      topicPlan: pendingReviewTopicPlan,
      stalePlanDetected: false
    }),
    true
  );

  assert.equal(
    canApproveTopicUpdateExecution({
      approvalPending: true,
      executionLoading: false,
      executionResult: null,
      planRefreshError: null,
      planRefreshLoading: false,
      topicPlan: {
        ...pendingReviewTopicPlan,
        status: "executed"
      },
      stalePlanDetected: false
    }),
    false
  );

  assert.equal(
    canApproveTopicUpdateExecution({
      approvalPending: true,
      executionLoading: false,
      executionResult: null,
      planRefreshError: null,
      planRefreshLoading: false,
      topicPlan: pendingReviewTopicPlan,
      stalePlanDetected: true
    }),
    false
  );
});

test("computeMatrixGates centralizes topic phase and gate decisions", () => {
  const baseState = {
    topicPlan: pendingReviewTopicPlan,
    topicApprovalPending: false,
    topicPrepareLoading: false,
    topicPrepareError: null,
    topicExecuteLoading: false,
    topicExecuteError: null,
    topicVerifyLoading: false,
    topicVerifyError: null,
    topicVerificationStatus: null,
    topicPlanRefreshLoading: false,
    topicPlanRefreshError: null,
    stalePlanDetected: false,
    hasScope: true,
  } as const;

  const prepared = computeMatrixGates(
    baseState,
    { canExecuteTopic: true },
    { backendHealthy: true },
    { failClosed: true },
  );
  assert.equal(prepared.topicPhase, "prepared");
  assert.equal(prepared.canApproveTopic, true);
  assert.equal(prepared.canRefreshTopicPlan, true);
  assert.equal(prepared.canVerifyTopic, true);

  const blocked = computeMatrixGates(
    {
      ...baseState,
      topicPlanRefreshError: "refresh failed",
    },
    { canExecuteTopic: true },
    { backendHealthy: true },
    { failClosed: true },
  );
  assert.equal(blocked.topicPhase, "blocked");
  assert.equal(blocked.canApproveTopic, false);

  const executing = computeMatrixGates(
    {
      ...baseState,
      topicExecuteLoading: true,
    },
    { canExecuteTopic: true },
    { backendHealthy: true },
    { failClosed: true },
  );
  assert.equal(executing.topicPhase, "executing");
  assert.equal(executing.canApproveTopic, false);

  const verified = computeMatrixGates(
    {
      ...baseState,
      topicPlan: {
        ...pendingReviewTopicPlan,
        status: "executed",
      },
      topicVerificationStatus: "verified",
    },
    { canExecuteTopic: true },
    { backendHealthy: true },
    { failClosed: true },
  );
  assert.equal(verified.topicPhase, "verified");
});

type GateSnapshot = {
  topicPhase: "idle" | "scoped" | "prepared" | "approval_pending" | "executing" | "verified" | "blocked";
  canPrepareTopic: boolean;
  canRefreshTopicPlan: boolean;
  canApproveTopic: boolean;
  canRejectTopic: boolean;
  canVerifyTopic: boolean;
};

type GateCase = {
  name: string;
  state: Partial<typeof baseGateState>;
  capabilities: { canExecuteTopic: boolean };
  health: { backendHealthy: boolean };
  policy: { failClosed: boolean };
  expected: GateSnapshot;
};

const baseGateState = {
  topicPlan: pendingReviewTopicPlan,
  topicApprovalPending: true,
  topicPrepareLoading: false,
  topicPrepareError: null,
  topicExecuteLoading: false,
  topicExecuteError: null,
  topicVerifyLoading: false,
  topicVerifyError: null,
  topicVerificationStatus: null,
  topicPlanRefreshLoading: false,
  topicPlanRefreshError: null,
  stalePlanDetected: false,
  hasScope: true,
} as const;

function runGateCase(gateCase: GateCase): GateSnapshot {
  return computeMatrixGates(
    { ...baseGateState, ...gateCase.state },
    gateCase.capabilities,
    gateCase.health,
    gateCase.policy
  );
}

test("matrix gates table: representative rows match snapshot", () => {
  const cases: GateCase[] = [
    {
      name: "happy path: backend healthy + capability + pending plan + fail-closed → approval allowed",
      state: {},
      capabilities: { canExecuteTopic: true },
      health: { backendHealthy: true },
      policy: { failClosed: true },
      expected: {
        topicPhase: "approval_pending",
        canPrepareTopic: true,
        canRefreshTopicPlan: true,
        canApproveTopic: true,
        canRejectTopic: true,
        canVerifyTopic: true
      }
    },
    {
      name: "fail-closed invariant: topicPlanRefreshError blocks approval (prepare and refresh stay available to recover)",
      state: { topicPlanRefreshError: "refresh failed" },
      capabilities: { canExecuteTopic: true },
      health: { backendHealthy: true },
      policy: { failClosed: true },
      expected: {
        topicPhase: "blocked",
        canPrepareTopic: true,
        canRefreshTopicPlan: true,
        canApproveTopic: false,
        canRejectTopic: false,
        canVerifyTopic: true
      }
    },
    {
      name: "fail-closed escape hatch: policy.failClosed=false allows approval even with refresh error",
      state: { topicPlanRefreshError: "refresh failed" },
      capabilities: { canExecuteTopic: true },
      health: { backendHealthy: true },
      policy: { failClosed: false },
      expected: {
        topicPhase: "blocked",
        canPrepareTopic: true,
        canRefreshTopicPlan: true,
        canApproveTopic: true,
        canRejectTopic: true,
        canVerifyTopic: true
      }
    },
    {
      name: "race: stalePlanDetected + topicExecuteLoading blocks approval",
      state: { stalePlanDetected: true, topicExecuteLoading: true },
      capabilities: { canExecuteTopic: true },
      health: { backendHealthy: true },
      policy: { failClosed: true },
      expected: {
        topicPhase: "executing",
        canPrepareTopic: false,
        canRefreshTopicPlan: false,
        canApproveTopic: false,
        canRejectTopic: false,
        canVerifyTopic: false
      }
    },
    {
      name: "backend unhealthy: every gate is false",
      state: {},
      capabilities: { canExecuteTopic: true },
      health: { backendHealthy: false },
      policy: { failClosed: true },
      expected: {
        topicPhase: "approval_pending",
        canPrepareTopic: false,
        canRefreshTopicPlan: false,
        canApproveTopic: false,
        canRejectTopic: false,
        canVerifyTopic: false
      }
    },
    {
      name: "capability missing (canExecuteTopic=false): no gates fire",
      state: {},
      capabilities: { canExecuteTopic: false },
      health: { backendHealthy: true },
      policy: { failClosed: true },
      expected: {
        topicPhase: "approval_pending",
        canPrepareTopic: false,
        canRefreshTopicPlan: false,
        canApproveTopic: false,
        canRejectTopic: false,
        canVerifyTopic: false
      }
    },
    {
      name: "no plan, has scope → idle phase, only canPrepareTopic true",
      state: { topicPlan: null, topicApprovalPending: false, hasScope: true },
      capabilities: { canExecuteTopic: true },
      health: { backendHealthy: true },
      policy: { failClosed: true },
      expected: {
        topicPhase: "scoped",
        canPrepareTopic: true,
        canRefreshTopicPlan: false,
        canApproveTopic: false,
        canRejectTopic: false,
        canVerifyTopic: false
      }
    },
    {
      name: "no plan, no scope → idle phase, nothing allowed",
      state: { topicPlan: null, topicApprovalPending: false, hasScope: false },
      capabilities: { canExecuteTopic: true },
      health: { backendHealthy: true },
      policy: { failClosed: true },
      expected: {
        topicPhase: "idle",
        canPrepareTopic: true,
        canRefreshTopicPlan: false,
        canApproveTopic: false,
        canRejectTopic: false,
        canVerifyTopic: false
      }
    },
    {
      name: "executed plan + verified status → verified phase",
      state: {
        topicPlan: { ...pendingReviewTopicPlan, status: "executed" as const },
        topicVerificationStatus: "verified" as const,
        topicApprovalPending: false
      },
      capabilities: { canExecuteTopic: true },
      health: { backendHealthy: true },
      policy: { failClosed: true },
      expected: {
        topicPhase: "verified",
        canPrepareTopic: true,
        canRefreshTopicPlan: true,
        canApproveTopic: false,
        canRejectTopic: false,
        canVerifyTopic: true
      }
    },
    {
      name: "executed plan + verify loading → prepared phase (verify loading does not flip to executing, only execute loading does)",
      state: {
        topicPlan: { ...pendingReviewTopicPlan, status: "executed" as const },
        topicVerificationStatus: null,
        topicApprovalPending: false,
        topicVerifyLoading: true
      },
      capabilities: { canExecuteTopic: true },
      health: { backendHealthy: true },
      policy: { failClosed: true },
      expected: {
        topicPhase: "prepared",
        canPrepareTopic: false,
        canRefreshTopicPlan: true,
        canApproveTopic: false,
        canRejectTopic: false,
        canVerifyTopic: false
      }
    },
    {
      name: "topicVerifyError fails closed: phase becomes blocked, but only topicPlanRefreshError closes the approval gate",
      state: { topicVerifyError: "verify failed" },
      capabilities: { canExecuteTopic: true },
      health: { backendHealthy: true },
      policy: { failClosed: true },
      expected: {
        topicPhase: "blocked",
        canPrepareTopic: true,
        canRefreshTopicPlan: true,
        canApproveTopic: true,
        canRejectTopic: true,
        canVerifyTopic: true
      }
    },
    {
      name: "canApproveTopicUpdateExecution happy path",
      state: {},
      capabilities: { canExecuteTopic: true },
      health: { backendHealthy: true },
      policy: { failClosed: true },
      expected: {
        topicPhase: "approval_pending",
        canPrepareTopic: true,
        canRefreshTopicPlan: true,
        canApproveTopic: true,
        canRejectTopic: true,
        canVerifyTopic: true
      }
    }
  ];

  for (const gateCase of cases) {
    const actual = runGateCase(gateCase);
    assert.deepEqual(
      actual,
      gateCase.expected,
      `case "${gateCase.name}" did not match expected snapshot`
    );
  }
});

test("canApproveTopicUpdateExecution integrates gates with the public helper", () => {
  // The helper wraps computeMatrixGates with hard-coded capability/health/policy,
  // so a few targeted rows are enough to lock the contract.
  assert.equal(
    canApproveTopicUpdateExecution({
      approvalPending: true,
      executionLoading: false,
      executionResult: null,
      planRefreshError: null,
      planRefreshLoading: false,
      topicPlan: pendingReviewTopicPlan,
      stalePlanDetected: false
    }),
    true
  );

  assert.equal(
    canApproveTopicUpdateExecution({
      approvalPending: true,
      executionLoading: false,
      executionResult: { executionId: "exec-1", planId: "plan-1", status: "success", verified: true, verificationSummary: "ok", before: {}, after: {} },
      planRefreshError: null,
      planRefreshLoading: false,
      topicPlan: pendingReviewTopicPlan,
      stalePlanDetected: false
    }),
    false,
    "approval is blocked once an executionResult exists (already executed)"
  );

  assert.equal(
    canApproveTopicUpdateExecution({
      approvalPending: false,
      executionLoading: false,
      executionResult: null,
      planRefreshError: null,
      planRefreshLoading: false,
      topicPlan: pendingReviewTopicPlan,
      stalePlanDetected: false
    }),
    true,
    "approval is gated on plan pending_review status, not the approvalPending flag (the helper exposes whether the gate is clear)"
  );

  assert.equal(
    canApproveTopicUpdateExecution({
      approvalPending: false,
      executionLoading: false,
      executionResult: null,
      planRefreshError: null,
      planRefreshLoading: false,
      topicPlan: { ...pendingReviewTopicPlan, status: "executed" as const },
      stalePlanDetected: false
    }),
    false,
    "approval is blocked once the plan is no longer pending_review"
  );
});
