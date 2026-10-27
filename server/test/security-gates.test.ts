import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";
import { createIntegrationAuthStore } from "../src/lib/integration-auth-store.js";
import {
  createMockMatrixClient,
  createMockOpenRouterClient,
  createTestEnv,
  createTestGitHubConfig,
  createTestMatrixConfig,
  TEST_MATRIX_AGENT_KEY
} from "../test-support/helpers.js";

function createMatrixTestApp(overrides: Parameters<typeof createTestEnv>[0] = {}) {
  return createApp({
    env: createTestEnv(overrides),
    openRouter: createMockOpenRouterClient(),
    matrixConfig: createTestMatrixConfig(),
    matrixClient: createMockMatrixClient(),
    logger: false
  });
}

function createGitHubTestApp(overrides: Parameters<typeof createTestEnv>[0] = {}) {
  return createApp({
    env: createTestEnv(overrides),
    openRouter: createMockOpenRouterClient(),
    githubConfig: createTestGitHubConfig(),
    logger: false
  });
}

test("matrix analyze and execute reject anonymous requests", async (t) => {
  const app = createMatrixTestApp();

  t.after(async () => {
    await app.close();
  });

  const analyzeResponse = await app.inject({
    method: "POST",
    url: "/api/matrix/analyze",
    payload: {
      roomId: "!room:matrix.example",
      proposedValue: "New topic"
    }
  });

  assert.equal(analyzeResponse.statusCode, 401);
  assert.equal(JSON.parse(analyzeResponse.body).error.code, "matrix_unauthorized");

  const executeResponse = await app.inject({
    method: "POST",
    url: "/api/matrix/actions/plan_missing/execute",
    payload: {
      approval: true
    }
  });

  assert.equal(executeResponse.statusCode, 401);
  assert.equal(JSON.parse(executeResponse.body).error.code, "matrix_unauthorized");
});

test("matrix analyze rejects wrong admin keys without touching the matrix client", async (t) => {
  const app = createMatrixTestApp();

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/matrix/analyze",
    headers: {
      "x-mosaicstacked-admin-key": "wrong-key"
    },
    payload: {
      roomId: "!room:matrix.example",
      proposedValue: "New topic"
    }
  });

  assert.equal(response.statusCode, 403);
  assert.equal(JSON.parse(response.body).error.code, "matrix_forbidden");
});

test("matrix analyze accepts the configured admin key", async (t) => {
  const app = createMatrixTestApp();

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/matrix/analyze",
    headers: {
      "x-mosaicstacked-admin-key": TEST_MATRIX_AGENT_KEY
    },
    payload: {
      roomId: "!room:matrix.example",
      proposedValue: "New topic"
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).ok, true);
});

test("matrix analyze honors the allowed action type env gate", async (t) => {
  const app = createMatrixTestApp({
    MATRIX_ALLOWED_ACTION_TYPES: []
  });

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/matrix/analyze",
    headers: {
      "x-mosaicstacked-admin-key": TEST_MATRIX_AGENT_KEY
    },
    payload: {
      roomId: "!room:matrix.example",
      proposedValue: "New topic"
    }
  });

  assert.equal(response.statusCode, 400);
  assert.equal(JSON.parse(response.body).error.code, "invalid_request");
});

test("matrix analyze is rate limited per scope", async (t) => {
  const app = createMatrixTestApp({
    RATE_LIMIT_MATRIX_ANALYZE_MAX: 2
  });

  t.after(async () => {
    await app.close();
  });

  const headers = {
    "x-mosaicstacked-admin-key": TEST_MATRIX_AGENT_KEY
  };
  const payload = {
    roomId: "!room:matrix.example",
    proposedValue: "New topic"
  };

  const first = await app.inject({ method: "POST", url: "/api/matrix/analyze", headers, payload });
  const second = await app.inject({ method: "POST", url: "/api/matrix/analyze", headers, payload });
  const third = await app.inject({ method: "POST", url: "/api/matrix/analyze", headers, payload });

  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
  assert.equal(third.statusCode, 429);
  assert.equal(JSON.parse(third.body).error.code, "matrix_rate_limited");
  assert.ok(third.headers["retry-after"]);
});

test("github read surfaces reject anonymous requests when github is ready", async (t) => {
  const app = createGitHubTestApp();

  t.after(async () => {
    await app.close();
  });

  const reposResponse = await app.inject({ method: "GET", url: "/api/github/repos" });
  assert.equal(reposResponse.statusCode, 401);
  assert.equal(JSON.parse(reposResponse.body).error.code, "github_unauthorized");

  const treeResponse = await app.inject({ method: "GET", url: "/api/github/repos/acme/widget/tree?ref=main" });
  assert.equal(treeResponse.statusCode, 401);

  const fileResponse = await app.inject({ method: "GET", url: "/api/github/repos/acme/widget/file?path=src/index.ts&ref=main" });
  assert.equal(fileResponse.statusCode, 401);

  const contextResponse = await app.inject({
    method: "POST",
    url: "/api/github/context",
    payload: { repo: { owner: "acme", repo: "widget" }, question: "What is this repo?" }
  });
  assert.equal(contextResponse.statusCode, 401);

  const proposeResponse = await app.inject({
    method: "POST",
    url: "/api/github/actions/propose",
    payload: { repo: { owner: "acme", repo: "widget" }, objective: "Review" }
  });
  assert.equal(proposeResponse.statusCode, 401);
});

test("github read surfaces accept a valid agent admin key", async (t) => {
  const app = createGitHubTestApp();

  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/api/github/repos",
    headers: {
      "x-mosaicstacked-admin-key": "test-github-admin-key"
    }
  });

  assert.equal(response.statusCode, 200);
  const payload = JSON.parse(response.body) as { credentialSource: string };
  assert.equal(payload.credentialSource, "instance_config");
});

test("github capabilities is throttled to mitigate admin key brute force", async (t) => {
  const app = createGitHubTestApp({
    RATE_LIMIT_GITHUB_CAPABILITIES_MAX: 3
  });

  t.after(async () => {
    await app.close();
  });

  const statuses: number[] = [];

  for (let index = 0; index < 5; index += 1) {
    const response = await app.inject({
      method: "GET",
      url: "/api/github/capabilities",
      headers: {
        "x-mosaicstacked-admin-key": `guess-${index}`
      }
    });
    statuses.push(response.statusCode);
  }

  assert.deepEqual(statuses.slice(0, 3), [200, 200, 200]);
  assert.deepEqual(statuses.slice(3), [429, 429]);
});

test("integration auth store rejects client-forged session ids (fixation)", () => {
  const store = createIntegrationAuthStore({ mode: "memory" });

  const forged = store.ensureSession("attacker-chosen-session-id");

  assert.notEqual(forged.sessionId, "attacker-chosen-session-id");
  assert.equal(forged.created, true);
  assert.equal(store.readConnection("attacker-chosen-session-id", "github"), null);

  // A second attempt with the same forged id must again mint a fresh id.
  const again = store.ensureSession("attacker-chosen-session-id");
  assert.notEqual(again.sessionId, "attacker-chosen-session-id");
  assert.notEqual(again.sessionId, forged.sessionId);
});

test("integration auth store reuses only server-issued session ids", () => {
  const store = createIntegrationAuthStore({ mode: "memory" });

  const issued = store.ensureSession(null);
  assert.equal(issued.created, true);

  const reused = store.ensureSession(issued.sessionId);
  assert.equal(reused.sessionId, issued.sessionId);
  assert.equal(reused.created, false);
});

test("integration auth store expires sessions after the ttl and drops credentials", () => {
  let currentTime = 1_000_000;
  const store = createIntegrationAuthStore({
    mode: "memory",
    sessionTtlMs: 60_000,
    now: () => currentTime,
    currentEncryptionKey: {
      keyId: "ttl-test-key",
      keyVersion: 1,
      keyMaterial: "ttl-test-secret"
    }
  });

  const session = store.ensureSession(null);
  const sessionId = session.sessionId;

  assert.equal(store.storeCredential(sessionId, "github", { accessToken: "gho_ttl_token" }), true);
  store.markConnected({
    sessionId,
    provider: "github",
    safeIdentityLabel: "octocat",
    source: "user_connected"
  });

  assert.equal(store.readCredential(sessionId, "github")?.accessToken, "gho_ttl_token");

  currentTime += 61_000;

  assert.equal(store.readCredential(sessionId, "github"), null);
  assert.equal(store.readConnection(sessionId, "github"), null);
});

test("integration auth store slides the ttl forward on activity", () => {
  let currentTime = 2_000_000;
  const store = createIntegrationAuthStore({
    mode: "memory",
    sessionTtlMs: 60_000,
    now: () => currentTime,
    currentEncryptionKey: {
      keyId: "ttl-test-key",
      keyVersion: 1,
      keyMaterial: "ttl-test-secret"
    }
  });

  const session = store.ensureSession(null);
  const sessionId = session.sessionId;
  store.storeCredential(sessionId, "matrix", { accessToken: "syt_matrix_token" });

  currentTime += 50_000;
  assert.equal(store.ensureSession(sessionId).sessionId, sessionId);

  currentTime += 20_000;
  // 70s since creation, but only 20s since last activity: still valid.
  assert.equal(store.readCredential(sessionId, "matrix")?.accessToken, "syt_matrix_token");

  currentTime += 70_000;
  assert.equal(store.readCredential(sessionId, "matrix"), null);
});
