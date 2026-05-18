import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createVercelRuntimeConfig, normalizeVercelRequestUrl } from "../../api/_handler.ts";
import { createRuntimeConfig } from "../src/runtime/create-runtime-config.js";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

test("vercel handler preserves matrix routes and strips the /api prefix for root API calls", () => {
  assert.equal(normalizeVercelRequestUrl("/api/chat"), "/chat");
  assert.equal(normalizeVercelRequestUrl("/api/models?include=all"), "/models?include=all");
  assert.equal(normalizeVercelRequestUrl("/api/health"), "/health");
  assert.equal(normalizeVercelRequestUrl("/api/auth/login"), "/api/auth/login");
  assert.equal(normalizeVercelRequestUrl("/api/auth/me?x=1"), "/api/auth/me?x=1");
  assert.equal(normalizeVercelRequestUrl("/api/integrations/status"), "/api/integrations/status");
  assert.equal(normalizeVercelRequestUrl("/api/matrix/whoami"), "/api/matrix/whoami");
  assert.equal(normalizeVercelRequestUrl("/api/matrix/analyze"), "/api/matrix/analyze");
  assert.equal(normalizeVercelRequestUrl("/api/matrix/actions/plan/execute"), "/api/matrix/actions/plan/execute");
  assert.equal(normalizeVercelRequestUrl("/api/matrix/actions/plan/verify?x=1"), "/api/matrix/actions/plan/verify?x=1");
  assert.equal(normalizeVercelRequestUrl("/api/github/repos"), "/api/github/repos");
  assert.equal(normalizeVercelRequestUrl("/api/github/actions/propose"), "/api/github/actions/propose");
  assert.equal(normalizeVercelRequestUrl("/api/github/actions/plan/execute"), "/api/github/actions/plan/execute");
  assert.equal(normalizeVercelRequestUrl("/api/github/repos/acme/widget/tree?ref=main"), "/api/github/repos/acme/widget/tree?ref=main");
});

test("local and vercel runtime builders normalize env from one shared source", () => {
  const source: NodeJS.ProcessEnv = {
    PORT: "9876",
    HOST: "0.0.0.0",
    OPENROUTER_API_KEY: "default-key",
    OPENROUTER_API_KEY_QWEN3_CODER: "qwen-key",
    OPENROUTER_API_KEY_GPT_OSS_120B_PLANNER: "planner-key",
    OPENROUTER_API_KEY_NEMOTRON_3_SUPER_120B: "nemotron-key",
    CHAT_MODEL: "google/gemma-4-31b-it:free",
    OPENROUTER_MODEL: "openrouter/auto",
    OPENROUTER_MODELS: "openrouter/auto,anthropic/claude-3.5-sonnet",
    GITHUB_ALLOWED_REPOS: "acme/widget"
  };
  const localRuntime = createRuntimeConfig({
    source,
    loadDotEnv: false
  });
  const vercelRuntime = createVercelRuntimeConfig(source);

  assert.equal(localRuntime.env.PORT, 9876);
  assert.equal(vercelRuntime.env.PORT, 9876);
  assert.equal(localRuntime.env.HOST, "0.0.0.0");
  assert.equal(vercelRuntime.env.HOST, "0.0.0.0");
  assert.deepEqual(localRuntime.env.OPENROUTER_MODELS, vercelRuntime.env.OPENROUTER_MODELS);
  assert.equal(localRuntime.env.CHAT_MODEL, vercelRuntime.env.CHAT_MODEL);
});

test("vercel handler import does not hydrate instance GitHub env from repo .env", () => {
  const script = `
    await import("./api/_handler.ts");
    const leaked = ["GITHUB_APP_INSTALLATION_ID", "GITHUB_ALLOWED_REPOS"].filter((key) => process.env[key]);
    if (leaked.length > 0) {
      console.error(leaked.join(","));
      process.exit(1);
    }
  `;
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "--eval", script],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: {
        HOME: process.env.HOME ?? "",
        PATH: process.env.PATH ?? "",
        NODE_ENV: "production",
        VERCEL: "1",
        GITHUB_APP_ID: "123456",
        GITHUB_APP_PRIVATE_KEY: "not-a-real-key",
        GITHUB_APP_SLUG: "mosaic-stack"
      }
    }
  );

  assert.equal(result.status, 0, `child status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
});
