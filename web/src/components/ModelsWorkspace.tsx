import React, { useMemo } from "react";
import { SectionLabel, ShellCard, StatusBadge } from "./ShellPrimitives.js";
import { StatusPanel } from "./StatusPanel.js";
import type { DiagnosticsResponse, IntegrationsStatusResponse, ModelResponse } from "../lib/api.js";
import type { Locale, WorkspaceMode } from "../lib/localization.js";
import type { WorkMode } from "../lib/work-mode.js";

type PublicModelEntry = ModelResponse["registry"][number];

export type ProviderHealthRow = {
  alias: string;
  label: string;
  status: "online" | "offline" | "degraded";
  tier: PublicModelEntry["tier"] | "unknown";
  capabilities: string[];
  streaming: boolean;
  model: PublicModelEntry;
};

type ModelsWorkspaceProps = {
  activeModelAlias: string | null;
  availableModels: string[];
  modelRegistry: PublicModelEntry[];
  onActiveModelAliasChange?: (alias: string) => void;
  routingStatus: { fallbackAllowed: boolean | null };
  runtimeDiagnostics: DiagnosticsResponse | null;
  integrationsStatus: IntegrationsStatusResponse | null;
  workMode: WorkMode;
  expertMode: boolean;
  locale: Locale;
  onTelemetry?: (kind: "info" | "warning" | "error", label: string, detail?: string) => void;
  onNavigateToWorkspace?: (mode: WorkspaceMode) => void;
};

function copy(locale: Locale) {
  return locale === "de"
    ? {
        title: "Modelle & Anbieter",
        status: "Backend-Routing",
        activeModel: "Aktives Modell",
        fallbackAllowed: "Fallback erlaubt",
        fallbackBlocked: "Fallback blockiert",
        fallbackUnknown: "Fallback unbekannt",
        registered: "Registrierte Modelle",
        providerHealth: "Provider-Status",
        route: "Routing-Kette",
        switchInChat: "Im Chat wechseln",
        capabilities: "Fähigkeiten",
        tier: "Tier",
        streaming: "Streaming",
        online: "online",
        offline: "offline",
        degraded: "eingeschränkt",
        noModels: "Keine öffentlichen Modell-Aliase geladen.",
        boundary: "Provider-Ziele bleiben Backend-Wahrheit; diese Fläche zeigt nur öffentliche Aliase und Status.",
      }
    : {
        title: "Models & Providers",
        status: "Backend routing",
        activeModel: "Active model",
        fallbackAllowed: "Fallback allowed",
        fallbackBlocked: "Fallback blocked",
        fallbackUnknown: "Fallback unknown",
        registered: "Registered models",
        providerHealth: "Provider health",
        route: "Routing chain",
        switchInChat: "Switch in Chat",
        capabilities: "Capabilities",
        tier: "Tier",
        streaming: "Streaming",
        online: "online",
        offline: "offline",
        degraded: "degraded",
        noModels: "No public model aliases are loaded.",
        boundary: "Provider targets stay backend truth; this surface shows public aliases and status only.",
      };
}

export function buildProviderHealthRows({
  activeModelAlias,
  availableModels,
  modelRegistry,
}: {
  activeModelAlias: string | null;
  availableModels: string[];
  modelRegistry: PublicModelEntry[];
  integrationsStatus?: IntegrationsStatusResponse | null;
}): ProviderHealthRow[] {
  const available = new Set(availableModels);
  return modelRegistry.map((model) => {
    const online = model.available !== false && (available.size === 0 || available.has(model.alias));
    const status: ProviderHealthRow["status"] = online
      ? "online"
      : model.alias === activeModelAlias
        ? "degraded"
        : "offline";
    return {
      alias: model.alias,
      label: model.label || model.alias,
      status,
      tier: model.tier ?? "unknown",
      capabilities: model.capabilities ?? [],
      streaming: Boolean(model.streaming),
      model,
    };
  });
}

function statusTone(status: ProviderHealthRow["status"]) {
  return status === "online" ? "ready" : status === "degraded" ? "partial" : "error";
}

export function ModelsWorkspace({
  activeModelAlias,
  availableModels,
  modelRegistry,
  routingStatus,
  runtimeDiagnostics,
  integrationsStatus,
  workMode: _workMode,
  expertMode,
  locale,
  onTelemetry,
  onNavigateToWorkspace,
}: ModelsWorkspaceProps) {
  const labels = copy(locale);
  const rows = useMemo(
    () => buildProviderHealthRows({ activeModelAlias, availableModels, modelRegistry, integrationsStatus }),
    [activeModelAlias, availableModels, integrationsStatus, modelRegistry],
  );
  const active = rows.find((row) => row.alias === activeModelAlias) ?? rows[0] ?? null;
  const fallbackLabel = routingStatus.fallbackAllowed === true
    ? labels.fallbackAllowed
    : routingStatus.fallbackAllowed === false
      ? labels.fallbackBlocked
      : labels.fallbackUnknown;

  return (
    <section className="workspace-panel models-workspace" data-testid="models-workspace">
      <section className="workspace-hero">
        <div>
          <p className="status-pill status-ready">{labels.status}</p>
          <h1>{labels.title}</h1>
          <p className="hero-copy">{labels.boundary}</p>
        </div>
      </section>

      <StatusPanel
        title={labels.status}
        headline={active?.label ?? "n/a"}
        badge={fallbackLabel}
        badgeTone={routingStatus.fallbackAllowed === false ? "error" : "ready"}
        rows={[
          { label: labels.activeModel, value: active?.label ?? activeModelAlias ?? "n/a" },
          { label: labels.registered, value: String(rows.length) },
          { label: labels.route, value: runtimeDiagnostics?.routing.mode ?? "n/a" },
        ]}
        safetyTitle={labels.status}
        safetyText={labels.boundary}
        expertMode={expertMode}
        expertRows={[
          { label: "runtime", value: runtimeDiagnostics?.runtimeMode ?? "n/a" },
          { label: "routing", value: runtimeDiagnostics?.routing.mode ?? "n/a" },
          { label: "integration-status", value: integrationsStatus?.generatedAt ?? "n/a" },
        ]}
      />

      <div className="workspace-grid models-grid">
        <ShellCard variant="base" className="workspace-card models-active-card">
          <header className="card-header">
            <div>
              <SectionLabel>{labels.activeModel}</SectionLabel>
              <strong>{active?.label ?? activeModelAlias ?? "n/a"}</strong>
            </div>
            <StatusBadge tone={active ? statusTone(active.status) : "muted"}>
              {active ? labels[active.status] : "n/a"}
            </StatusBadge>
          </header>
          <div className="approval-meta-grid">
            <div>
              <span>{labels.tier}</span>
              <strong>{active?.tier ?? "n/a"}</strong>
            </div>
            <div>
              <span>{labels.streaming}</span>
              <strong>{String(Boolean(active?.streaming))}</strong>
            </div>
            <div>
              <span>{labels.capabilities}</span>
              <strong>{active?.capabilities.join(", ") || "n/a"}</strong>
            </div>
          </div>
          <div className="action-row">
            <button
              type="button"
              onClick={() => {
                onTelemetry?.("info", "models-switch-requested", active?.alias ?? activeModelAlias ?? "n/a");
                onNavigateToWorkspace?.("chat");
              }}
            >
              {labels.switchInChat}
            </button>
          </div>
        </ShellCard>

        <ShellCard variant="base" className="workspace-card models-provider-card">
          <header className="card-header">
            <div>
              <SectionLabel>{labels.providerHealth}</SectionLabel>
              <strong>{labels.providerHealth}</strong>
            </div>
          </header>
          {rows.length === 0 ? <p className="shell-muted-copy">{labels.noModels}</p> : null}
          <div className="review-queue-list">
            {rows.map((row) => (
              <article key={row.alias} className="review-queue-item">
                <div className="review-queue-item-header">
                  <div>
                    <span>{row.alias}</span>
                    <strong>{row.label}</strong>
                  </div>
                  <StatusBadge tone={statusTone(row.status)}>{labels[row.status]}</StatusBadge>
                </div>
                <div className="approval-meta-grid">
                  <div>
                    <span>{labels.tier}</span>
                    <strong>{row.tier}</strong>
                  </div>
                  <div>
                    <span>{labels.capabilities}</span>
                    <strong>{row.capabilities.join(", ") || "n/a"}</strong>
                  </div>
                  <div>
                    <span>{labels.streaming}</span>
                    <strong>{String(row.streaming)}</strong>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </ShellCard>
      </div>
    </section>
  );
}
