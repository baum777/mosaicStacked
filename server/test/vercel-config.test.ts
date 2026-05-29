import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

type VercelConfig = {
  functions?: Record<string, {
    maxDuration?: number;
    includeFiles?: string | string[];
  }>;
  rewrites?: Array<{
    source: string;
    destination: string;
  }>;
};

function assertIncludeFiles(entry: string | string[] | undefined) {
  assert.ok(entry, "includeFiles must be configured");

  if (Array.isArray(entry)) {
    assert.deepEqual(entry, [
      "config/llm-router.yml",
      "config/model-capabilities.yml"
    ]);
    return;
  }

  assert.equal(entry, "config/*.yml");
}

test("vercel config bundles runtime-loaded config files for both api entrypoints", () => {
  const vercelConfigPath = fileURLToPath(new URL("../../vercel.json", import.meta.url));
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8")) as VercelConfig;

  assert.equal(vercelConfig.functions?.["api/[...path].ts"]?.maxDuration, 60);
  assertIncludeFiles(vercelConfig.functions?.["api/[...path].ts"]?.includeFiles);
  assert.equal(vercelConfig.functions?.["api/matrix/[...path].ts"]?.maxDuration, 60);
  assertIncludeFiles(vercelConfig.functions?.["api/matrix/[...path].ts"]?.includeFiles);
});

test("vercel config keeps governed GitHub and Matrix API routes on backend adapters", () => {
  const vercelConfigPath = fileURLToPath(new URL("../../vercel.json", import.meta.url));
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8")) as VercelConfig;
  const rewrites = new Map((vercelConfig.rewrites ?? []).map((rewrite) => [rewrite.source, rewrite.destination]));

  assert.ok(vercelConfig.functions?.["api/[...path].ts"], "root API catch-all must be a Vercel function");
  assert.ok(vercelConfig.functions?.["api/matrix/[...path].ts"], "Matrix API catch-all must be a Vercel function");
  assert.equal(rewrites.get("/health"), "/api/health");
  assert.equal(rewrites.get("/models"), "/api/models");
  assert.equal(rewrites.get("/chat"), "/api/chat");
  assert.equal(rewrites.get("/diagnostics"), "/api/diagnostics");
  assert.equal(rewrites.get("/journal/recent"), "/api/journal/recent");
  assert.equal(rewrites.get("/api/github/:path*"), undefined);
  assert.equal(rewrites.get("/api/matrix/:path*"), "/api/matrix/[...path]");
  assert.equal(rewrites.get("/api/:path*"), "/api/[...path]");
  assert.equal(rewrites.get("/:path*"), "/");
  assert.equal([...rewrites.values()].some((destination) => destination.includes(":path*")), false);
});

test("vercel config routes OpenRouter settings and model APIs before the SPA fallback", () => {
  const vercelConfigPath = fileURLToPath(new URL("../../vercel.json", import.meta.url));
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8")) as VercelConfig;
  const rewrites = vercelConfig.rewrites ?? [];
  const routeIndex = new Map(rewrites.map((rewrite, index) => [rewrite.source, index]));
  const routeDestination = new Map(rewrites.map((rewrite) => [rewrite.source, rewrite.destination]));
  const fallbackIndex = routeIndex.get("/:path*");

  assert.equal(routeDestination.get("/models/openrouter"), "/api/models/openrouter");
  assert.equal(routeDestination.get("/settings/openrouter/status"), "/api/settings/openrouter/status");
  assert.equal(routeDestination.get("/settings/openrouter/credentials"), "/api/settings/openrouter/credentials");
  assert.equal(routeDestination.get("/settings/openrouter/test"), "/api/settings/openrouter/test");
  assert.equal(typeof fallbackIndex, "number", "SPA fallback rewrite must exist");

  for (const source of [
    "/models/openrouter",
    "/settings/openrouter/status",
    "/settings/openrouter/credentials",
    "/settings/openrouter/test"
  ]) {
    const index = routeIndex.get(source);
    assert.equal(typeof index, "number", `${source} rewrite must exist`);
    assert.ok(index < fallbackIndex, `${source} must be routed before the SPA fallback`);
  }
});
