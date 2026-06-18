import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildIntegrationConnectStartUrl,
  fetchDiagnostics,
  fetchHealth,
  fetchIntegrationsStatus,
  fetchJournalRecent,
  fetchModels,
  fetchOpenRouterCredentialStatus,
  type DiagnosticsResponse,
  type IntegrationsStatusResponse,
  type JournalEntry,
  type OpenRouterCredentialStatusResponse,
} from "../lib/api.js";
import {
  fetchGitHubCapabilities,
  type GitHubCapabilitiesResponse,
} from "../lib/github-api.js";
import { createRequestDedupCache, type RequestDedupCache } from "../lib/request-dedup-cache.js";

const OPENROUTER_CREDENTIAL_STATUS_EMPTY: OpenRouterCredentialStatusResponse = {
  configured: false,
  models: [],
  defaultFree: {
    alias: "default-free",
    label: "Free default",
    source: "env_configured",
    status: "missing_model",
    modelId: null,
  },
};

function normalizeOpenRouterCredentialStatus(
  status: Partial<OpenRouterCredentialStatusResponse> | null | undefined,
): OpenRouterCredentialStatusResponse {
  const defaultFree = status?.defaultFree;

  return {
    configured: status?.configured === true,
    models: Array.isArray(status?.models) ? status.models : [],
    defaultFree: {
      alias: "default-free",
      label: typeof defaultFree?.label === "string" && defaultFree.label.trim().length > 0
        ? defaultFree.label
        : "Free default",
      source: defaultFree?.source === "user_configured" || defaultFree?.source === "dev_fallback"
        ? defaultFree.source
        : "env_configured",
      status: defaultFree?.status === "configured" || defaultFree?.status === "missing_key"
        ? defaultFree.status
        : "missing_model",
      modelId: typeof defaultFree?.modelId === "string" ? defaultFree.modelId : null,
    },
  };
}

const STATUS_CACHE_TTL_MS = 60_000;

type RuntimeTelemetry = (kind: "info" | "warning" | "error", label: string, detail?: string) => void;

type ModelRegistryEntry = {
  alias: string;
  label: string;
  description: string;
  capabilities: string[];
  tier: "core" | "specialized" | "fallback";
  streaming: boolean;
  recommendedFor: string[];
  default?: boolean;
  available?: boolean;
};

function isAbortError(error: unknown) {
  return (error instanceof DOMException && error.name === "AbortError")
    || (error instanceof Error && error.name === "AbortError");
}

function toErrorDetail(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function mapOpenRouterRegistry(models: OpenRouterCredentialStatusResponse["models"]): ModelRegistryEntry[] {
  return models.map((model) => ({
    alias: model.alias,
    label: model.label,
    description: "User-configured OpenRouter model stored in backend profile settings.",
    capabilities: ["chat", "streaming"],
    tier: "specialized" as const,
    streaming: true,
    recommendedFor: ["user_configured_openrouter"],
    available: true,
  }));
}

function createStatusCache(): RequestDedupCache {
  return createRequestDedupCache();
}

export function useRuntimeStatus(options: {
  mode: "chat" | "workbench" | "review" | "community" | "models" | "evidence" | "matrix" | "settings" | "perf";
  locale: "de" | "en";
  appText: {
    telemetryHealthLoaded: string;
    telemetryHealthLoadedDetail: (service: string, mode: string, allowedModelCount: number) => string;
    telemetryHealthFailed: string;
    telemetryHealthFailedDetail: string;
    telemetryModelAliasLoaded: string;
    telemetryModelAliasLoadedDetail: (alias: string) => string;
    telemetryModelListFailed: string;
    telemetryModelListFailedDetail: string;
    telemetryDiagnosticsFailed: string;
    telemetryDiagnosticsFailedDetail: string;
  };
  onTelemetry: RuntimeTelemetry;
}) {
  const {
    mode,
    locale,
    appText,
    onTelemetry,
  } = options;
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [activeModelAlias, setActiveModelAlias] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelRegistry, setModelRegistry] = useState<ModelRegistryEntry[]>([]);
  const [openRouterCredentialStatus, setOpenRouterCredentialStatus] = useState<OpenRouterCredentialStatusResponse>(OPENROUTER_CREDENTIAL_STATUS_EMPTY);
  const [runtimeDiagnostics, setRuntimeDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [integrationsStatus, setIntegrationsStatus] = useState<IntegrationsStatusResponse | null>(null);
  const [githubCapabilities, setGitHubCapabilities] = useState<GitHubCapabilitiesResponse | null>(null);
  const [runtimeJournalEntries, setRuntimeJournalEntries] = useState<JournalEntry[]>([]);

  const statusCacheRef = useRef<RequestDedupCache>(createStatusCache());
  const statusRequestScopeRef = useRef<AbortController | null>(null);
  const modeEffectInitializedRef = useRef(false);

  const abortStatusRequests = useCallback(() => {
    statusRequestScopeRef.current?.abort();
    statusRequestScopeRef.current = null;
  }, []);

  const createStatusRequestSignal = useCallback(() => {
    statusRequestScopeRef.current?.abort();
    const controller = new AbortController();
    statusRequestScopeRef.current = controller;
    return controller.signal;
  }, []);

  const fetchCachedStatus = useCallback(<T,>(options: {
    key: string;
    signal?: AbortSignal;
    fetcher: (signal?: AbortSignal) => Promise<T>;
    ttlMs?: number;
    staleWhileRevalidate?: boolean;
  }) => statusCacheRef.current.getOrFetch({
    key: options.key,
    ttlMs: options.ttlMs ?? STATUS_CACHE_TTL_MS,
    staleWhileRevalidate: options.staleWhileRevalidate ?? true,
    signal: options.signal,
    fetcher: options.fetcher,
  }), []);

  const refreshIntegrationsStatus = useCallback(async (signal?: AbortSignal) => {
    try {
      const nextStatus = await fetchCachedStatus({
        key: "integrations",
        signal,
        fetcher: (requestSignal) => fetchIntegrationsStatus({ signal: requestSignal }),
      });
      setIntegrationsStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      if (isAbortError(error)) {
        return null;
      }

      setIntegrationsStatus(null);
      return null;
    }
  }, [fetchCachedStatus]);

  const refreshGitHubCapabilities = useCallback(async (signal?: AbortSignal) => {
    try {
      const capabilities = await fetchCachedStatus({
        key: "github-capabilities",
        signal,
        fetcher: () => fetchGitHubCapabilities(),
      });
      setGitHubCapabilities(capabilities);
      return capabilities;
    } catch (error) {
      if (isAbortError(error)) {
        return null;
      }

      setGitHubCapabilities(null);
      return null;
    }
  }, [fetchCachedStatus]);

  const refreshOpenRouterCredentialStatus = useCallback(async () => {
    const fetchedStatus = await fetchOpenRouterCredentialStatus();
    const status = normalizeOpenRouterCredentialStatus(fetchedStatus);
    setOpenRouterCredentialStatus(status);

    if (status.configured) {
      const userModels: string[] = status.models.map((model) => model.alias);
      setAvailableModels((current) => [...new Set([...current, ...userModels])]);
      setModelRegistry((current) => {
        const withoutUser = current.filter((model) => !userModels.includes(model.alias));
        return [...withoutUser, ...mapOpenRouterRegistry(status.models)];
      });
      setActiveModelAlias(status.models[0]?.alias ?? "user_openrouter_default");
    }

    return status;
  }, []);

  const loadConsoleState = useCallback(async (emitTelemetry = true) => {
    const signal = createStatusRequestSignal();

    const healthStatusPromise = fetchCachedStatus({
      key: "health",
      signal,
      fetcher: (requestSignal) => fetchHealth({ signal: requestSignal }),
    });
    const modelsStatusPromise = fetchCachedStatus({
      key: "models",
      signal,
      fetcher: (requestSignal) => fetchModels({ signal: requestSignal }),
    });
    const diagnosticsStatusPromise = fetchCachedStatus({
      key: "diagnostics",
      signal,
      fetcher: (requestSignal) => fetchDiagnostics({ signal: requestSignal }),
    });
    const journalStatusPromise = fetchCachedStatus({
      key: "journal",
      signal,
      fetcher: (requestSignal) => fetchJournalRecent({ signal: requestSignal }),
    });
    const integrationsStatusPromise = fetchCachedStatus({
      key: "integrations",
      signal,
      fetcher: (requestSignal) => fetchIntegrationsStatus({ signal: requestSignal }),
    });
    const openRouterCredentialStatusPromise = fetchOpenRouterCredentialStatus();
    const githubCapabilitiesPromise = fetchCachedStatus({
      key: "github-capabilities",
      signal,
      fetcher: () => fetchGitHubCapabilities(),
    });

    void healthStatusPromise
      .then(() => {
        if (!signal.aborted) {
          setBackendHealthy(true);
        }
      })
      .catch((error) => {
        if (!signal.aborted && !isAbortError(error)) {
          setBackendHealthy(false);
        }
      });

    void integrationsStatusPromise
      .then((nextStatus) => {
        if (!signal.aborted) {
          setIntegrationsStatus(nextStatus);
        }
      })
      .catch((error) => {
        if (!signal.aborted && !isAbortError(error)) {
          setIntegrationsStatus(null);
        }
      });

    void githubCapabilitiesPromise
      .then((capabilities) => {
        if (!signal.aborted) {
          setGitHubCapabilities(capabilities);
        }
      })
      .catch((error) => {
        if (!signal.aborted && !isAbortError(error)) {
          setGitHubCapabilities(null);
        }
      });

    const [
      healthResult,
      modelsResult,
      diagnosticsResult,
      journalResult,
      integrationsResult,
      openRouterStatusResult,
      githubCapabilitiesResult,
    ] = await Promise.allSettled([
      healthStatusPromise,
      modelsStatusPromise,
      diagnosticsStatusPromise,
      journalStatusPromise,
      integrationsStatusPromise,
      openRouterCredentialStatusPromise,
      githubCapabilitiesPromise,
    ]);

    if (signal.aborted) {
      return;
    }

    if (healthResult.status === "fulfilled") {
      const health = healthResult.value;
      setBackendHealthy(true);
      if (emitTelemetry) {
        onTelemetry("info", appText.telemetryHealthLoaded, appText.telemetryHealthLoadedDetail(health.service, health.mode, health.allowedModelCount));
      }
    } else {
      setBackendHealthy(false);
      if (emitTelemetry) {
        onTelemetry("error", appText.telemetryHealthFailed, toErrorDetail(healthResult.reason, appText.telemetryHealthFailedDetail));
      }
    }

    const userOpenRouterStatus = openRouterStatusResult.status === "fulfilled"
      ? normalizeOpenRouterCredentialStatus(openRouterStatusResult.value)
      : OPENROUTER_CREDENTIAL_STATUS_EMPTY;
    setOpenRouterCredentialStatus(userOpenRouterStatus);

    if (modelsResult.status === "fulfilled") {
      const userModelRegistry = mapOpenRouterRegistry(userOpenRouterStatus.models);
      const registry = [...(modelsResult.value.registry ?? []), ...userModelRegistry];
      const models = [...modelsResult.value.models, ...userOpenRouterStatus.models.map((model) => model.alias)];
      const hasDefaultFreeAlias = models.includes("default-free");
      const defaultAlias = userOpenRouterStatus.configured
        ? "user_openrouter_default"
        : hasDefaultFreeAlias
          ? "default-free"
          : modelsResult.value.defaultModel;

      setAvailableModels(models);
      setActiveModelAlias(defaultAlias);
      setModelRegistry(registry);
      if (emitTelemetry) {
        onTelemetry("info", appText.telemetryModelAliasLoaded, appText.telemetryModelAliasLoadedDetail(defaultAlias));
      }
    } else {
      setAvailableModels([]);
      setModelRegistry([]);
      if (emitTelemetry) {
        onTelemetry("error", appText.telemetryModelListFailed, toErrorDetail(modelsResult.reason, appText.telemetryModelListFailedDetail));
      }
    }

    if (diagnosticsResult.status === "fulfilled") {
      setRuntimeDiagnostics(diagnosticsResult.value);
    } else {
      setRuntimeDiagnostics(null);
      if (emitTelemetry && !isAbortError(diagnosticsResult.reason)) {
        onTelemetry("warning", appText.telemetryDiagnosticsFailed, toErrorDetail(diagnosticsResult.reason, appText.telemetryDiagnosticsFailedDetail));
      }
    }

    if (journalResult.status === "fulfilled") {
      setRuntimeJournalEntries(journalResult.value.entries);
    } else {
      setRuntimeJournalEntries([]);
    }

    if (integrationsResult.status === "fulfilled") {
      setIntegrationsStatus(integrationsResult.value);
    } else {
      setIntegrationsStatus(null);
    }

    if (githubCapabilitiesResult.status === "fulfilled") {
      setGitHubCapabilities(githubCapabilitiesResult.value);
    } else {
      setGitHubCapabilities(null);
    }
  }, [
    appText.telemetryDiagnosticsFailed,
    appText.telemetryDiagnosticsFailedDetail,
    appText.telemetryHealthFailed,
    appText.telemetryHealthFailedDetail,
    appText.telemetryHealthLoaded,
    appText.telemetryHealthLoadedDetail,
    appText.telemetryModelAliasLoaded,
    appText.telemetryModelAliasLoadedDetail,
    appText.telemetryModelListFailed,
    appText.telemetryModelListFailedDetail,
    createStatusRequestSignal,
    fetchCachedStatus,
    onTelemetry,
  ]);

  useEffect(() => {
    void loadConsoleState(true);

    return () => {
      abortStatusRequests();
    };
  }, [abortStatusRequests, loadConsoleState]);

  useEffect(() => {
    if (!modeEffectInitializedRef.current) {
      modeEffectInitializedRef.current = true;
      return;
    }

    abortStatusRequests();
    void loadConsoleState(false);
  }, [abortStatusRequests, loadConsoleState, mode]);

  const routingStatus = useMemo(
    () => ({
      fallbackAllowed: runtimeDiagnostics?.routing.allowFallback ?? null,
    }),
    [runtimeDiagnostics?.routing.allowFallback],
  );

  return {
    backendHealthy,
    setBackendHealthy,
    activeModelAlias,
    setActiveModelAlias,
    availableModels,
    modelRegistry,
    runtimeDiagnostics,
    integrationsStatus,
    githubCapabilities,
    runtimeJournalEntries,
    openRouterCredentialStatus,
    routingStatus,
    refreshIntegrationsStatus,
    refreshGitHubCapabilities,
    refreshOpenRouterCredentialStatus,
    clearStatusCache: () => statusCacheRef.current.clear(),
  };
}
