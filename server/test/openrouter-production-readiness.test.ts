import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  formatOpenRouterProductionReadinessResult,
  runOpenRouterProductionReadiness
} from "../../scripts/openrouter-production-readiness.mjs";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

test("openrouter production readiness guard is exposed as an opt-in smoke script", () => {
  const packageJson = JSON.parse(readFileSync(`${repoRoot}/package.json`, "utf8")) as {
    scripts?: Record<string, string>;
  };

  assert.equal(packageJson.scripts?.["smoke:openrouter-prod"], "node scripts/openrouter-production-readiness.mjs");
});

test("openrouter production readiness guard checks only read-only JSON endpoints", async () => {
  const requests: Array<{ method: string; path: string }> = [];
  const result = await runOpenRouterProductionReadiness({
    env: {
      MOSAICSTACK_PRODUCTION_BASE_URL: "https://prod.example"
    },
    fetchImpl: async (input, init) => {
      const requestUrl = typeof input === "string" ? new URL(input) : new URL(input.url);
      requests.push({
        method: String(init?.method ?? "GET"),
        path: requestUrl.pathname
      });

      if (requestUrl.pathname === "/models") {
        return createJsonResponse({
          ok: true,
          registry: [
            {
              alias: "default-free",
              available: true
            }
          ]
        });
      }

      if (
        requestUrl.pathname === "/settings/openrouter/status"
        || requestUrl.pathname === "/api/settings/openrouter/status"
      ) {
        return createJsonResponse({
          configured: false,
          models: [],
          defaultFree: {
            alias: "default-free",
            label: "Free default",
            source: "env_configured",
            status: "configured",
            modelId: "openrouter/free"
          }
        });
      }

      throw new Error(`Unexpected route ${requestUrl.pathname}`);
    }
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, "passed");
  assert.deepEqual(requests, [
    { method: "GET", path: "/models" },
    { method: "GET", path: "/settings/openrouter/status" },
    { method: "GET", path: "/api/settings/openrouter/status" }
  ]);
  assert.doesNotMatch(JSON.stringify(requests), /\/chat/);
});

test("openrouter production readiness guard fails closed when a status route serves SPA HTML", async () => {
  const result = await runOpenRouterProductionReadiness({
    env: {
      MOSAICSTACK_PRODUCTION_BASE_URL: "https://prod.example"
    },
    fetchImpl: async (input) => {
      const requestUrl = typeof input === "string" ? new URL(input) : new URL(input.url);

      if (requestUrl.pathname === "/models") {
        return createJsonResponse({
          ok: true,
          registry: [
            {
              alias: "default-free",
              available: true
            }
          ]
        });
      }

      return new Response("<!doctype html><html></html>", {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8"
        }
      });
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, "failed");
  assert.equal(result.phase, "settings_status");
  assert.equal(result.error.code, "openrouter_prod_non_json");
});

test("openrouter production readiness guard fails when default-free is not configured", async () => {
  const result = await runOpenRouterProductionReadiness({
    env: {
      MOSAICSTACK_PRODUCTION_BASE_URL: "https://prod.example"
    },
    fetchImpl: async (input) => {
      const requestUrl = typeof input === "string" ? new URL(input) : new URL(input.url);

      if (requestUrl.pathname === "/models") {
        return createJsonResponse({
          ok: true,
          registry: [
            {
              alias: "default-free",
              available: false
            }
          ]
        });
      }

      return createJsonResponse({
        configured: false,
        models: [],
        defaultFree: {
          alias: "default-free",
          label: "Free default",
          source: "env_configured",
          status: "missing_model",
          modelId: null
        }
      });
    }
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, "failed");
  assert.equal(result.phase, "models");
  assert.equal(result.error.code, "default_free_unavailable");
});

test("openrouter production readiness output is bounded and secret-free", () => {
  const output = formatOpenRouterProductionReadinessResult({
    ok: true,
    status: "passed",
    baseUrl: "https://prod.example",
    checks: {
      models: {
        status: "passed",
        defaultFreeAvailable: true
      },
      settingsStatus: {
        status: "passed",
        defaultFreeStatus: "configured",
        modelId: "openrouter/free"
      },
      apiSettingsStatus: {
        status: "passed",
        defaultFreeStatus: "configured",
        modelId: "openrouter/free"
      }
    }
  });

  assert.doesNotMatch(output, /sk-or-/);
  assert.doesNotMatch(output, /authorization/i);
  assert.match(output, /"defaultFreeStatus": "configured"/);
});
