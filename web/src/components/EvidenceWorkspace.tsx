import React, { useMemo, useState } from "react";
import { SectionLabel, ShellCard, StatusBadge } from "./ShellPrimitives.js";
import { StatusPanel } from "./StatusPanel.js";
import type { DiagnosticEntry, SettingsTruthSnapshot } from "./SettingsWorkspace.js";
import type { DiagnosticsResponse, JournalEntry } from "../lib/api.js";
import type { Locale, WorkspaceMode } from "../lib/localization.js";
import type { WorkMode } from "../lib/work-mode.js";

type EvidenceKind = "action" | "decision" | "check" | "error";

export type EvidenceTimelineEntry = {
  id: string;
  timestamp: string;
  kind: EvidenceKind;
  source: string;
  summary: string;
  status: string;
  detail: string;
  originWorkspace: WorkspaceMode;
  raw: unknown;
};

type EvidenceWorkspaceProps = {
  journalEntries: JournalEntry[];
  diagnostics: Array<DiagnosticEntry & { timestamp?: string }>;
  runtimeDiagnostics: DiagnosticsResponse | null;
  settingsTruthSnapshot: SettingsTruthSnapshot | null;
  workMode: WorkMode;
  expertMode: boolean;
  locale: Locale;
  onTelemetry?: (kind: "info" | "warning" | "error", label: string, detail?: string) => void;
  onClearDiagnostics: () => void;
  onNavigateToWorkspace?: (mode: WorkspaceMode) => void;
};

function copy(locale: Locale) {
  return locale === "de"
    ? {
        title: "Nachvollziehbarkeitsprotokoll",
        status: "Audit-Timeline",
        intro: "Journal, Entscheidungen, Prüfungen und lokale Diagnostics als unveränderliche Evidence-Ansicht.",
        all: "Alle",
        actions: "Aktionen",
        decisions: "Entscheidungen",
        checks: "Checks",
        errors: "Fehler",
        exportJson: "JSON exportieren",
        clearDiagnostics: "Diagnostics löschen",
        openChat: "Chat öffnen",
        openWorkbench: "Workbench öffnen",
        openReview: "Review öffnen",
        openMatrix: "Matrix öffnen",
        empty: "Keine Evidence-Einträge vorhanden.",
        entries: "Einträge",
        latest: "Neuester Eintrag",
      }
    : {
        title: "Evidence Log",
        status: "Audit timeline",
        intro: "Journal, decisions, checks, and local diagnostics as an immutable evidence view.",
        all: "All",
        actions: "Actions",
        decisions: "Decisions",
        checks: "Checks",
        errors: "Errors",
        exportJson: "Export JSON",
        clearDiagnostics: "Clear Diagnostics",
        openChat: "Open Chat",
        openWorkbench: "Open Workbench",
        openReview: "Open Review",
        openMatrix: "Open Matrix",
        empty: "No evidence entries available.",
        entries: "Entries",
        latest: "Latest entry",
      };
}

function classifyJournal(entry: JournalEntry): EvidenceKind {
  if (entry.severity === "error" || entry.outcome === "failed" || entry.outcome === "blocked") {
    return "error";
  }
  if (entry.eventType.includes("approval") || entry.eventType.includes("decision")) {
    return "decision";
  }
  if (entry.outcome === "verified" || entry.eventType.includes("check") || entry.eventType.includes("verify")) {
    return "check";
  }
  return "action";
}

function originForSource(source: JournalEntry["source"] | string): WorkspaceMode {
  if (source === "github") {
    return "workbench";
  }
  if (source === "matrix") {
    return "matrix";
  }
  if (source === "chat") {
    return "chat";
  }
  return "settings";
}

export function buildEvidenceTimeline({
  journalEntries,
  diagnostics,
}: {
  journalEntries: JournalEntry[];
  diagnostics: Array<DiagnosticEntry & { timestamp?: string }>;
}): EvidenceTimelineEntry[] {
  const journalTimeline = journalEntries.map((entry): EvidenceTimelineEntry => ({
    id: entry.id,
    timestamp: entry.timestamp,
    kind: classifyJournal(entry),
    source: entry.source,
    summary: entry.summary,
    status: entry.outcome,
    detail: entry.correlationId ?? entry.planId ?? entry.executionId ?? entry.eventType,
    originWorkspace: originForSource(entry.source),
    raw: entry,
  }));

  const diagnosticTimeline = diagnostics.map((entry, index): EvidenceTimelineEntry => ({
    id: `diagnostic-${index}-${entry.label}`,
    timestamp: entry.timestamp ?? new Date(0).toISOString(),
    kind: entry.kind === "error" ? "error" : "check",
    source: "browser",
    summary: entry.label,
    status: entry.kind,
    detail: entry.detail ?? entry.label,
    originWorkspace: "settings",
    raw: entry,
  }));

  return [...journalTimeline, ...diagnosticTimeline].sort((left, right) =>
    right.timestamp.localeCompare(left.timestamp),
  );
}

function statusTone(kind: EvidenceKind) {
  return kind === "error" ? "error" : kind === "check" ? "ready" : "partial";
}

function workspaceLabel(labels: ReturnType<typeof copy>, workspace: WorkspaceMode) {
  if (workspace === "workbench") {
    return labels.openWorkbench;
  }
  if (workspace === "matrix") {
    return labels.openMatrix;
  }
  if (workspace === "chat") {
    return labels.openChat;
  }
  if (workspace === "review") {
    return labels.openReview;
  }
  return "Settings";
}

export function EvidenceWorkspace({
  journalEntries,
  diagnostics,
  runtimeDiagnostics,
  settingsTruthSnapshot,
  workMode: _workMode,
  expertMode,
  locale,
  onTelemetry,
  onClearDiagnostics,
  onNavigateToWorkspace,
}: EvidenceWorkspaceProps) {
  const labels = copy(locale);
  const [filter, setFilter] = useState<EvidenceKind | "all">("all");
  const timeline = useMemo(
    () => buildEvidenceTimeline({ journalEntries, diagnostics }),
    [diagnostics, journalEntries],
  );
  const filteredTimeline = filter === "all"
    ? timeline
    : timeline.filter((entry) => entry.kind === filter);
  const latest = timeline[0] ?? null;

  function exportJson() {
    const serialized = JSON.stringify(filteredTimeline.map((entry) => entry.raw), null, 2);
    onTelemetry?.("info", "evidence-json-exported", `${filteredTimeline.length} entries`);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(serialized);
    }
  }

  return (
    <section className="workspace-panel evidence-workspace" data-testid="evidence-workspace">
      <section className="workspace-hero">
        <div>
          <p className="status-pill status-ready">{labels.status}</p>
          <h1>{labels.title}</h1>
          <p className="hero-copy">{labels.intro}</p>
        </div>
      </section>

      <StatusPanel
        title={labels.status}
        headline={String(timeline.length)}
        badge={settingsTruthSnapshot?.journal.status ?? "local"}
        badgeTone={timeline.some((entry) => entry.kind === "error") ? "partial" : "ready"}
        rows={[
          { label: labels.entries, value: String(timeline.length) },
          { label: labels.latest, value: latest?.summary ?? "n/a" },
          { label: "runtime", value: runtimeDiagnostics?.runtimeMode ?? settingsTruthSnapshot?.diagnostics.runtimeMode ?? "n/a" },
        ]}
        safetyTitle={labels.status}
        safetyText={labels.intro}
        expertMode={expertMode}
        expertRows={timeline.slice(0, 8).map((entry) => ({ label: entry.id, value: `${entry.kind}:${entry.status}` }))}
      />

      <ShellCard variant="base" className="workspace-card evidence-timeline-card">
        <header className="card-header">
          <div>
            <SectionLabel>{labels.status}</SectionLabel>
            <strong>{labels.title}</strong>
          </div>
        </header>

        <div className="action-row evidence-filter-row">
          <button type="button" className={filter === "all" ? "" : "secondary-button"} onClick={() => setFilter("all")}>{labels.all}</button>
          <button type="button" className={filter === "action" ? "" : "secondary-button"} onClick={() => setFilter("action")}>{labels.actions}</button>
          <button type="button" className={filter === "decision" ? "" : "secondary-button"} onClick={() => setFilter("decision")}>{labels.decisions}</button>
          <button type="button" className={filter === "check" ? "" : "secondary-button"} onClick={() => setFilter("check")}>{labels.checks}</button>
          <button type="button" className={filter === "error" ? "" : "secondary-button"} onClick={() => setFilter("error")}>{labels.errors}</button>
          <button type="button" className="secondary-button" onClick={exportJson}>{labels.exportJson}</button>
          <button type="button" className="secondary-button" onClick={onClearDiagnostics}>{labels.clearDiagnostics}</button>
        </div>

        <div className="review-queue-list">
          {filteredTimeline.length === 0 ? <p className="shell-muted-copy">{labels.empty}</p> : null}
          {filteredTimeline.map((entry) => (
            <article key={entry.id} className="review-queue-item">
              <div className="review-queue-item-header">
                <div>
                  <span>{entry.timestamp}</span>
                  <strong>{entry.summary}</strong>
                </div>
                <StatusBadge tone={statusTone(entry.kind)}>{entry.kind}</StatusBadge>
              </div>
              <p>{entry.detail}</p>
              <div className="approval-meta-grid">
                <div>
                  <span>source</span>
                  <strong>{entry.source}</strong>
                </div>
                <div>
                  <span>status</span>
                  <strong>{entry.status}</strong>
                </div>
                <div>
                  <span>origin</span>
                  <strong>{entry.originWorkspace}</strong>
                </div>
              </div>
              <div className="action-row">
                <button type="button" className="secondary-button" onClick={() => onNavigateToWorkspace?.(entry.originWorkspace)}>
                  {workspaceLabel(labels, entry.originWorkspace)}
                </button>
              </div>
            </article>
          ))}
        </div>
      </ShellCard>
    </section>
  );
}
