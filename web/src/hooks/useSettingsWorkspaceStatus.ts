import { useCallback, useState } from "react";
import {
  buildIntegrationConnectStartUrl,
  postIntegrationControlAction,
  saveOpenRouterCredentials,
  testOpenRouterCredentials,
  testSettingsConnection,
} from "../lib/api.js";
import type {
  SettingsVerificationState,
  SettingsVerificationTarget,
} from "../lib/settings-types.js";
import { areOpenRouterCredentialInputsValid } from "../lib/openrouter-inputs.js";

const SETTINGS_VERIFICATION_INITIAL: Record<SettingsVerificationTarget, SettingsVerificationState> = {
  backend: {
    status: "idle",
    detail: "",
    checkedAt: null,
  },
  github: {
    status: "idle",
    detail: "",
    checkedAt: null,
  },
  matrix: {
    status: "idle",
    detail: "",
    checkedAt: null,
  },
};

function toErrorDetail(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type SettingsTelemetry = (kind: "info" | "warning" | "error", label: string, detail?: string) => void;

export type UseSettingsWorkspaceStatusOptions = {
  locale: "de" | "en";
  onTelemetry: SettingsTelemetry;
  refreshOpenRouterCredentialStatus: () => Promise<unknown>;
  refreshIntegrationsStatus: (signal?: AbortSignal) => Promise<unknown>;
  refreshGitHubCapabilities: (signal?: AbortSignal) => Promise<unknown>;
  setBackendHealthy: (value: boolean) => void;
  clearStatusCache: () => void;
};

export function useSettingsWorkspaceStatus(options: UseSettingsWorkspaceStatusOptions) {
  const {
    locale,
    onTelemetry,
    refreshOpenRouterCredentialStatus,
    refreshIntegrationsStatus,
    refreshGitHubCapabilities,
    setBackendHealthy,
    clearStatusCache,
  } = options;

  const [openRouterApiKeyInput, setOpenRouterApiKeyInput] = useState("");
  const [openRouterModelInput, setOpenRouterModelInput] = useState("");
  const [isSavingOpenRouterCredentials, setIsSavingOpenRouterCredentials] = useState(false);
  const [isTestingOpenRouterCredentials, setIsTestingOpenRouterCredentials] = useState(false);
  const [openRouterCredentialMessage, setOpenRouterCredentialMessage] = useState<string | null>(null);
  const [settingsVerificationResults, setSettingsVerificationResults] = useState(SETTINGS_VERIFICATION_INITIAL);

  const handleSaveOpenRouterCredentials = useCallback(async () => {
    const modelId = openRouterModelInput.trim();
    const apiKey = openRouterApiKeyInput.trim();

    if (!areOpenRouterCredentialInputsValid(apiKey, modelId)) {
      setOpenRouterCredentialMessage("OpenRouter credential input does not match the backend contract.");
      return;
    }

    setIsSavingOpenRouterCredentials(true);
    setOpenRouterCredentialMessage(null);

    try {
      const result = await saveOpenRouterCredentials({ apiKey, modelId });
      setOpenRouterApiKeyInput("");
      setOpenRouterCredentialMessage(result.status);
      await refreshOpenRouterCredentialStatus();
      onTelemetry("info", "OpenRouter credentials saved", `Backend public alias ${result.model.alias} is selectable.`);
    } catch (error) {
      const message = toErrorDetail(error, "Unable to save OpenRouter credentials.");
      setOpenRouterCredentialMessage(message);
      onTelemetry("error", "OpenRouter credential save failed", message);
    } finally {
      setIsSavingOpenRouterCredentials(false);
    }
  }, [onTelemetry, openRouterApiKeyInput, openRouterModelInput, refreshOpenRouterCredentialStatus]);

  const handleTestOpenRouterCredentials = useCallback(async () => {
    const modelId = openRouterModelInput.trim();
    const apiKey = openRouterApiKeyInput.trim();

    if (!areOpenRouterCredentialInputsValid(apiKey, modelId)) {
      setOpenRouterCredentialMessage("OpenRouter credential input does not match the backend contract.");
      return;
    }

    setIsTestingOpenRouterCredentials(true);
    setOpenRouterCredentialMessage(null);

    try {
      const result = await testOpenRouterCredentials({ apiKey, modelId });
      setOpenRouterCredentialMessage(`Test passed for ${result.model.alias}`);
      onTelemetry("info", "OpenRouter credential test passed", `Backend tested alias ${result.model.alias} without saving credentials.`);
    } catch (error) {
      const message = toErrorDetail(error, "Unable to test OpenRouter credentials.");
      setOpenRouterCredentialMessage(message);
      onTelemetry("error", "OpenRouter credential test failed", message);
    } finally {
      setIsTestingOpenRouterCredentials(false);
    }
  }, [onTelemetry, openRouterApiKeyInput, openRouterModelInput]);

  const handleSettingsVerifyConnection = useCallback(async (target: SettingsVerificationTarget) => {
    setSettingsVerificationResults((current) => ({
      ...current,
      [target]: {
        ...current[target],
        status: "checking",
        detail: "",
      },
    }));

    try {
      const result = await testSettingsConnection(target);
      const checkedAt = new Date().toISOString();

      if (target === "backend") {
        setBackendHealthy(true);
      } else {
        await refreshIntegrationsStatus();
        await refreshGitHubCapabilities();
      }

      setSettingsVerificationResults((current) => ({
        ...current,
        [target]: {
          status: "passed",
          detail: result.detail,
          checkedAt,
        },
      }));
      onTelemetry(
        "info",
        locale === "de" ? "Verbindung geprüft" : "Connection verified",
        `${target}: ${result.detail}`,
      );
    } catch (error) {
      const detail = toErrorDetail(error, "Connection check failed");

      if (target === "backend") {
        setBackendHealthy(false);
      } else {
        await refreshIntegrationsStatus();
        await refreshGitHubCapabilities();
      }

      setSettingsVerificationResults((current) => ({
        ...current,
        [target]: {
          status: "failed",
          detail,
          checkedAt: new Date().toISOString(),
        },
      }));
      onTelemetry(
        "warning",
        locale === "de" ? "Verbindungsprüfung fehlgeschlagen" : "Connection verification failed",
        `${target}: ${detail}`,
      );
    }
  }, [locale, onTelemetry, refreshGitHubCapabilities, refreshIntegrationsStatus, setBackendHealthy]);

  const handleIntegrationAction = useCallback(async (
    provider: "github" | "matrix",
    action: "connect" | "reconnect" | "disconnect" | "reverify",
  ) => {
    if (action === "connect" || action === "reconnect") {
      window.location.assign(buildIntegrationConnectStartUrl(provider, "/console?mode=settings"));
      return;
    }

    try {
      await postIntegrationControlAction(provider, action);
      clearStatusCache();
    } catch (error) {
      onTelemetry(
        "warning",
        locale === "de" ? "Integrationsaktion fehlgeschlagen" : "Integration action failed",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      await refreshIntegrationsStatus();
      await refreshGitHubCapabilities();
    }
  }, [clearStatusCache, locale, onTelemetry, refreshGitHubCapabilities, refreshIntegrationsStatus]);

  const buildSettingsIntegrationStartUrl = useCallback((provider: "github" | "matrix") => (
    buildIntegrationConnectStartUrl(provider, "/console?mode=settings")
  ), []);

  return {
    openRouterApiKeyInput,
    setOpenRouterApiKeyInput,
    openRouterModelInput,
    setOpenRouterModelInput,
    isSavingOpenRouterCredentials,
    isTestingOpenRouterCredentials,
    openRouterCredentialMessage,
    settingsVerificationResults,
    handleSaveOpenRouterCredentials,
    handleTestOpenRouterCredentials,
    handleSettingsVerifyConnection,
    handleIntegrationAction,
    buildSettingsIntegrationStartUrl,
  };
}
