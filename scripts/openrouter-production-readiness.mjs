#!/usr/bin/env node
import { pathToFileURL } from "node:url";

const defaultProductionBaseUrl = "https://mosaicstacked.vercel.app";

function normalizeBaseUrl(value) {
  const raw = String(value ?? "").trim();
  const baseUrl = raw || defaultProductionBaseUrl;

  return baseUrl.replace(/\/+$/, "");
}

function createFailure(code, message, phase, details = {}) {
  return {
    ok: false,
    status: "failed",
    phase,
    error: {
      code,
      message
    },
    ...details
  };
}

async function readResponseText(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

async function requestJson(fetchImpl, baseUrl, path, phase) {
  let response;

  try {
    response = await fetchImpl(`${baseUrl}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Production endpoint is unreachable";

    return createFailure("openrouter_prod_unreachable", message, phase, {
      baseUrl,
      endpoint: path
    });
  }

  const raw = await readResponseText(response);
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    return createFailure("openrouter_prod_http_error", `Production endpoint returned HTTP ${response.status}`, phase, {
      baseUrl,
      endpoint: path,
      httpStatus: response.status
    });
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    return createFailure("openrouter_prod_non_json", "Production endpoint returned non-JSON content", phase, {
      baseUrl,
      endpoint: path,
      contentType
    });
  }

  let payload;

  try {
    payload = JSON.parse(raw);
  } catch {
    return createFailure("openrouter_prod_invalid_json", "Production endpoint returned invalid JSON", phase, {
      baseUrl,
      endpoint: path,
      contentType
    });
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return createFailure("openrouter_prod_invalid_json", "Production endpoint returned a non-object JSON payload", phase, {
      baseUrl,
      endpoint: path,
      contentType
    });
  }

  return {
    ok: true,
    payload
  };
}

function findDefaultFreeRegistryEntry(payload) {
  if (!Array.isArray(payload.registry)) {
    return null;
  }

  return payload.registry.find((entry) => entry && typeof entry === "object" && entry.alias === "default-free") ?? null;
}

function assertModelsPayload(payload, baseUrl) {
  const defaultFree = findDefaultFreeRegistryEntry(payload);

  if (!defaultFree) {
    return createFailure("default_free_missing", "/models did not include the default-free alias", "models", {
      baseUrl,
      endpoint: "/models"
    });
  }

  if (defaultFree.available !== true) {
    return createFailure("default_free_unavailable", "/models reports default-free as unavailable", "models", {
      baseUrl,
      endpoint: "/models",
      defaultFreeAvailable: defaultFree.available ?? null
    });
  }

  return {
    status: "passed",
    defaultFreeAvailable: true
  };
}

function assertStatusPayload(payload, baseUrl, endpoint, phase) {
  const defaultFree = payload.defaultFree;

  if (!defaultFree || typeof defaultFree !== "object") {
    return createFailure("default_free_status_missing", `${endpoint} did not include defaultFree status`, phase, {
      baseUrl,
      endpoint
    });
  }

  const defaultFreeStatus = typeof defaultFree.status === "string" ? defaultFree.status : null;
  const modelId = typeof defaultFree.modelId === "string" && defaultFree.modelId.trim().length > 0
    ? defaultFree.modelId.trim()
    : null;

  if (defaultFreeStatus !== "configured" || !modelId) {
    return createFailure("default_free_not_configured", `${endpoint} does not report configured default-free routing`, phase, {
      baseUrl,
      endpoint,
      defaultFreeStatus,
      modelId
    });
  }

  return {
    status: "passed",
    defaultFreeStatus,
    modelId,
    source: typeof defaultFree.source === "string" ? defaultFree.source : null
  };
}

function assertStatusConsistency(settingsStatus, apiSettingsStatus, baseUrl) {
  for (const key of ["defaultFreeStatus", "modelId", "source"]) {
    if (settingsStatus[key] !== apiSettingsStatus[key]) {
      return createFailure("default_free_status_mismatch", "OpenRouter status routes disagree", "status_consistency", {
        baseUrl,
        field: key,
        settingsStatus: settingsStatus[key],
        apiSettingsStatus: apiSettingsStatus[key]
      });
    }
  }

  return {
    status: "passed"
  };
}

export async function runOpenRouterProductionReadiness(options = {}) {
  const env = options.env ?? process.env;
  const baseUrl = normalizeBaseUrl(env.MOSAICSTACK_PRODUCTION_BASE_URL);
  const fetchImpl = options.fetchImpl ?? fetch;

  const modelsResponse = await requestJson(fetchImpl, baseUrl, "/models", "models");

  if (!modelsResponse.ok) {
    return modelsResponse;
  }

  const modelsCheck = assertModelsPayload(modelsResponse.payload, baseUrl);

  if (modelsCheck.ok === false) {
    return modelsCheck;
  }

  const settingsResponse = await requestJson(fetchImpl, baseUrl, "/settings/openrouter/status", "settings_status");

  if (!settingsResponse.ok) {
    return settingsResponse;
  }

  const settingsStatusCheck = assertStatusPayload(
    settingsResponse.payload,
    baseUrl,
    "/settings/openrouter/status",
    "settings_status"
  );

  if (settingsStatusCheck.ok === false) {
    return settingsStatusCheck;
  }

  const apiSettingsResponse = await requestJson(fetchImpl, baseUrl, "/api/settings/openrouter/status", "api_settings_status");

  if (!apiSettingsResponse.ok) {
    return apiSettingsResponse;
  }

  const apiSettingsStatusCheck = assertStatusPayload(
    apiSettingsResponse.payload,
    baseUrl,
    "/api/settings/openrouter/status",
    "api_settings_status"
  );

  if (apiSettingsStatusCheck.ok === false) {
    return apiSettingsStatusCheck;
  }

  const consistencyCheck = assertStatusConsistency(settingsStatusCheck, apiSettingsStatusCheck, baseUrl);

  if (consistencyCheck.ok === false) {
    return consistencyCheck;
  }

  return {
    ok: true,
    status: "passed",
    baseUrl,
    checks: {
      models: modelsCheck,
      settingsStatus: settingsStatusCheck,
      apiSettingsStatus: apiSettingsStatusCheck,
      statusConsistency: consistencyCheck
    }
  };
}

export function formatOpenRouterProductionReadinessResult(result) {
  return JSON.stringify(result, null, 2);
}

async function main() {
  const result = await runOpenRouterProductionReadiness();

  console.log(formatOpenRouterProductionReadinessResult(result));
  process.exitCode = result.ok ? 0 : 1;
}

const isMain = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isMain) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown OpenRouter production readiness failure";

    console.error(formatOpenRouterProductionReadinessResult({
      ok: false,
      status: "failed",
      phase: "main",
      error: {
        code: "openrouter_prod_unhandled_error",
        message
      }
    }));
    process.exitCode = 1;
  });
}
