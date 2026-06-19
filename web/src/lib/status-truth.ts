export type StatusTruthState =
  | "backend-ok"
  | "credentials-missing"
  | "integration-disconnected"
  | "local-restored"
  | "real-error";

export type StatusTruthLabel = {
  label: string;
  hint: string;
};

export type StatusTruthInput = {
  backendHealthy: boolean | null;
  restoredSession: boolean;
  openRouterConfigured: boolean | null;
  runtimeMode: string | null;
  integration: {
    configured: boolean | null;
    status: string | null;
  } | null;
  hasRealError: boolean;
};

const DISCONNECTED_STATUSES = new Set<string>([
  "not_connected",
  "auth_expired",
  "scope_denied",
  "missing_server_config",
  "upstream_unreachable",
  "disabled_by_policy",
]);

export function deriveStatusTruth(input: StatusTruthInput): StatusTruthState {
  if (input.backendHealthy === true) {
    if (input.hasRealError) {
      return "real-error";
    }

    if (
      input.openRouterConfigured === false
      && input.runtimeMode === "production"
    ) {
      return "credentials-missing";
    }

    if (
      input.integration
      && (
        input.integration.configured === false
        || (
          typeof input.integration.status === "string"
          && DISCONNECTED_STATUSES.has(input.integration.status)
        )
      )
    ) {
      return "integration-disconnected";
    }

    return "backend-ok";
  }

  if (input.restoredSession) {
    return "local-restored";
  }

  if (input.hasRealError) {
    return "real-error";
  }

  return "local-restored";
}

export function formatStatusTruthLabel(
  locale: "en" | "de",
  state: StatusTruthState,
): StatusTruthLabel {
  if (locale === "de") {
    switch (state) {
      case "backend-ok":
        return {
          label: "Backend erreichbar",
          hint: "Backend antwortet. Ausführung bleibt serverseitig.",
        };
      case "credentials-missing":
        return {
          label: "Anmeldedaten fehlen",
          hint: "Backend ist erreichbar, aber das OpenRouter-Profil hat noch keinen Key.",
        };
      case "integration-disconnected":
        return {
          label: "Integration nicht verbunden",
          hint: "Backend erreichbar, aber GitHub oder Matrix ist nicht verbunden.",
        };
      case "local-restored":
        return {
          label: "Lokal wiederhergestellt",
          hint: "Aus dem lokalen Speicher geladen, bevor das Backend antwortet.",
        };
      case "real-error":
        return {
          label: "Echter Fehler",
          hint: "Backend hat einen realen Fehler gemeldet.",
        };
    }
  }

  switch (state) {
    case "backend-ok":
      return {
        label: "Backend ready",
        hint: "Backend reachable. Execution stays server-side.",
      };
    case "credentials-missing":
      return {
        label: "Credentials missing",
        hint: "Backend reachable, but the OpenRouter profile has no key yet.",
      };
    case "integration-disconnected":
      return {
        label: "Integration not connected",
        hint: "Backend reachable, but GitHub or Matrix is not connected.",
      };
    case "local-restored":
      return {
        label: "Restored from local cache",
        hint: "Loaded from local storage before the backend answered.",
      };
    case "real-error":
      return {
        label: "Real error",
        hint: "Backend reported a real error.",
      };
  }
}
