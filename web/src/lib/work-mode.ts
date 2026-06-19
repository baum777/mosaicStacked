import type { Locale } from "./localization.js";

export type WorkMode = "beginner" | "expert";

export type WorkModeCopy = {
  label: string;
  shortLabel: string;
  description: string;
  riskHint: string;
  controlHint: string;
};

export type WorkModeVisibility = {
  showGuidance: boolean;
  showExpertDetails: boolean;
  showDiagnosticsByDefault: boolean;
  showTechnicalIdentifiers: boolean;
  showRawPreview: boolean;
};

export const PRIMARY_WORKSPACES = [
  "chat",
  "workbench",
  "matrix",
  "settings",
  "perf",
] as const;

export const SECONDARY_WORKSPACES = [
  "review",
  "community",
  "models",
  "evidence",
] as const;

export function isPrimaryWorkspace(mode: string): boolean {
  return (PRIMARY_WORKSPACES as readonly string[]).includes(mode);
}

export function isSecondaryWorkspace(mode: string): boolean {
  return (SECONDARY_WORKSPACES as readonly string[]).includes(mode);
}

export function filterWorkspacesForMode<T extends { mode: string }>(
  items: readonly T[],
  workMode: WorkMode,
): T[] {
  if (workMode === "expert") {
    return items.slice();
  }
  return items.filter((item) => isPrimaryWorkspace(item.mode));
}

const COPY: Record<Locale, Record<WorkMode, WorkModeCopy>> = {
  en: {
    beginner: {
      label: "Beginner mode",
      shortLabel: "Beginner",
      description: "Guided and quiet. Read first, preview changes, approve deliberately.",
      riskHint: "Safe default: writes stay blocked until preview and approval.",
      controlHint: "Run the next primary action.",
    },
    expert: {
      label: "Expert mode",
      shortLabel: "Expert",
      description: "Full context and control. Scope, diagnostics, provenance, and diffs stay close.",
      riskHint: "Same approval gates; more technical control is visible.",
      controlHint: "Use scope, diagnostics, diff, and policy details directly.",
    },
  },
  de: {
    beginner: {
      label: "Beginner-Modus",
      shortLabel: "Basis",
      description: "Geführt und ruhig. Erst lesen, Änderungen vorab prüfen, bewusst freigeben.",
      riskHint: "Sicherer Standard: Writes bleiben bis Vorschau und Freigabe gesperrt.",
      controlHint: "Führe die nächste Hauptaktion aus.",
    },
    expert: {
      label: "Expertenmodus",
      shortLabel: "Experte",
      description: "Volle Kontrolle und Kontext. Scope, Diagnostik, Provenienz und Diffs bleiben erreichbar.",
      riskHint: "Gleiche Approval-Gates; mehr technische Kontrolle ist sichtbar.",
      controlHint: "Nutze Scope, Diagnostik, Diff und Policy-Details direkt.",
    },
  },
};

export const WORK_MODE_VISIBILITY: Record<WorkMode, WorkModeVisibility> = {
  beginner: {
    showGuidance: true,
    showExpertDetails: false,
    showDiagnosticsByDefault: false,
    showTechnicalIdentifiers: false,
    showRawPreview: false,
  },
  expert: {
    showGuidance: false,
    showExpertDetails: true,
    showDiagnosticsByDefault: true,
    showTechnicalIdentifiers: true,
    showRawPreview: true,
  },
};

export function isWorkMode(value: unknown): value is WorkMode {
  return value === "beginner" || value === "expert";
}

export function isExpertMode(workMode: WorkMode) {
  return workMode === "expert";
}

export function isBeginnerMode(workMode: WorkMode) {
  return workMode === "beginner";
}

export function getWorkModeCopy(locale: Locale, workMode: WorkMode) {
  return COPY[locale][workMode];
}

export function getWorkModeVisibility(workMode: WorkMode) {
  return WORK_MODE_VISIBILITY[workMode];
}

export function resolvePersistedWorkMode(value: { workMode?: unknown; expertMode?: unknown } | null | undefined): WorkMode {
  if (isWorkMode(value?.workMode)) {
    return value.workMode;
  }

  return value?.expertMode === true ? "expert" : "beginner";
}
