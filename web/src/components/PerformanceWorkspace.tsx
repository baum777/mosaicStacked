import React from "react";
import { useLocalization } from "../lib/localization.js";
import { StatusBadge } from "./ShellPrimitives.js";
import { SwipeDeck } from "./shared/SwipeDeck.js";
import perfCache from "../lib/perf-cache.json";

type MetricTone = "ready" | "partial" | "error";

function readNumber(source: Record<string, unknown> | undefined, key: string): number | null {
  const value = source?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const lighthouseSource = (perfCache as { lighthouse?: Record<string, unknown> }).lighthouse;
const bundleSource = (perfCache as { bundle?: Record<string, unknown> }).bundle;

const lcpMs = readNumber(lighthouseSource, "lcpMs");
const clsValue = readNumber(lighthouseSource, "cls");
const ttiMs = readNumber(lighthouseSource, "ttiMs");
const gzipBytes = readNumber(bundleSource, "gzipBytes");
const brotliBytes = readNumber(bundleSource, "brotliBytes");
const budgetGzipBytes = readNumber(bundleSource, "budgetGzipBytes");

const lastUpdated: string = (() => {
  const raw = (perfCache as { lastUpdated?: unknown }).lastUpdated;
  if (typeof raw !== "string" || raw === "unknown" || raw.length === 0) {
    return "unknown";
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "unknown" : parsed.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" });
})();

const lcpDisplay = lcpMs !== null ? `${(lcpMs / 1000).toFixed(1)} s` : "–";
const clsDisplay = clsValue !== null ? clsValue.toFixed(2) : "–";
const ttiDisplay = ttiMs !== null ? `${(ttiMs / 1000).toFixed(1)} s` : "–";
const bundleOk = gzipBytes !== null && budgetGzipBytes !== null && gzipBytes <= budgetGzipBytes;
const bundleDisplay = gzipBytes !== null && budgetGzipBytes !== null
  ? (bundleOk ? "pass" : "over budget")
  : "–";

const lcpTone: MetricTone = lcpMs !== null ? (lcpMs <= 2500 ? "ready" : lcpMs <= 4000 ? "partial" : "error") : "partial";
const clsTone: MetricTone = clsValue !== null ? (clsValue <= 0.1 ? "ready" : clsValue <= 0.25 ? "partial" : "error") : "partial";
const ttiTone: MetricTone = ttiMs !== null ? (ttiMs <= 3800 ? "ready" : ttiMs <= 7300 ? "partial" : "error") : "partial";
const bundleTone: MetricTone = bundleOk ? "ready" : "partial";

const overallTone: MetricTone = [lcpTone, clsTone, ttiTone, bundleTone].includes("error")
  ? "error"
  : [lcpTone, clsTone, ttiTone, bundleTone].includes("partial")
    ? "partial"
    : "ready";

const overallLabel = overallTone === "ready" ? "Pass" : overallTone === "error" ? "Failed" : "Partial";

function MetricChip({ label, value, tone }: { label: string; value: string; tone: MetricTone }) {
  return (
    <div className={`perf-metric-chip perf-metric-chip-${tone}`}>
      <span className="perf-metric-chip-label">{label}</span>
      <strong className="perf-metric-chip-value">{value}</strong>
    </div>
  );
}

function DetailPanel({ label, value, tone, command, detail }: {
  label: string;
  value: string;
  tone: MetricTone;
  command: string;
  detail: string;
}) {
  return (
    <div className="perf-detail-panel">
      <div className="perf-detail-panel-header">
        <span className="perf-detail-panel-kicker">PERFORMANCE · {label.toUpperCase()}</span>
        <StatusBadge tone={tone}>{tone === "ready" ? "pass" : tone === "error" ? "fail" : "partial"}</StatusBadge>
      </div>
      <strong className="perf-detail-panel-value">{value}</strong>
      <p className="perf-detail-panel-detail">{detail}</p>
      <code className="perf-detail-panel-cmd">{command}</code>
    </div>
  );
}

export function PerformanceWorkspace() {
  const { locale } = useLocalization();
  const localUpdated = locale === "de" ? "Letzte Messung" : "Local evidence";

  const panels = [
    {
      id: "overview",
      label: locale === "de" ? "Übersicht" : "Overview",
      content: (
        <div className="perf-overview-panel">
          <div className="perf-overview-timestamp">
            <span>{localUpdated}</span>
            <span data-testid="performance-last-updated" data-last-updated={(perfCache as { lastUpdated?: unknown }).lastUpdated ?? "unknown"}>
              {lastUpdated}
            </span>
          </div>
          <div className="perf-overview-gate">
            <StatusBadge tone={overallTone}>{overallLabel}</StatusBadge>
            <span className="perf-overview-gate-label">
              {locale === "de" ? "Gate-Status · lokale Evidenz" : "Gate state · local evidence only"}
            </span>
          </div>
          <div className="perf-metric-chip-row">
            <MetricChip label="LCP" value={lcpDisplay} tone={lcpTone} />
            <MetricChip label="CLS" value={clsDisplay} tone={clsTone} />
            <MetricChip label="TTI" value={ttiDisplay} tone={ttiTone} />
            <MetricChip label={locale === "de" ? "Bundle" : "Bundle"} value={bundleDisplay} tone={bundleTone} />
          </div>
          <p className="perf-overview-note">
            {locale === "de"
              ? "Keine Live-CI, kein Deployment — nur lokale Evidenz."
              : "No live CI or deployment claimed — local evidence only."}
          </p>
        </div>
      ),
    },
    {
      id: "bundle",
      label: "Bundle budget",
      content: (
        <DetailPanel
          label="Bundle budget"
          value={gzipBytes !== null ? `${Math.round(gzipBytes / 1024)} kB gzip` : "–"}
          tone={bundleTone}
          command="npm run perf:bundle:web"
          detail={bundleSource && gzipBytes !== null && budgetGzipBytes !== null
            ? `${Math.round(gzipBytes / 1024)} kB / ${Math.round(budgetGzipBytes / 1024)} kB budget · ${brotliBytes !== null ? `${Math.round(brotliBytes / 1024)} kB brotli` : ""}`
            : "Run the bundle gate to get size evidence."}
        />
      ),
    },
    {
      id: "lighthouse",
      label: "Lighthouse",
      content: (
        <div className="perf-detail-panel">
          <div className="perf-detail-panel-header">
            <span className="perf-detail-panel-kicker">PERFORMANCE · LIGHTHOUSE</span>
            <StatusBadge tone={overallTone}>{overallLabel.toLowerCase()}</StatusBadge>
          </div>
          <div className="perf-lighthouse-metrics">
            <DetailPanel label="LCP" value={lcpDisplay} tone={lcpTone} command="npm run perf:lighthouse:tti" detail="Largest Contentful Paint — target ≤ 2.5 s" />
            <DetailPanel label="CLS" value={clsDisplay} tone={clsTone} command="npm run perf:lighthouse:tti" detail="Cumulative Layout Shift — target ≤ 0.1" />
            <DetailPanel label="TTI" value={ttiDisplay} tone={ttiTone} command="npm run perf:lighthouse:tti" detail="Time to Interactive — target ≤ 3.8 s" />
          </div>
        </div>
      ),
    },
    {
      id: "typecheck",
      label: "Typecheck web",
      content: (
        <DetailPanel
          label="Typecheck web"
          value={locale === "de" ? "Evidenz offen" : "Evidence pending"}
          tone="partial"
          command="npm run typecheck:web"
          detail={locale === "de"
            ? "TypeScript-Typprüfung. Erst als pass werten, wenn der lokale Lauf belegt ist."
            : "TypeScript type check. Treat as pass only when a local run is recorded."}
        />
      ),
    },
    {
      id: "tests",
      label: "Unit web",
      content: (
        <DetailPanel
          label="Unit web"
          value={locale === "de" ? "Evidenz offen" : "Evidence pending"}
          tone="partial"
          command="npm run test:web"
          detail={locale === "de"
            ? "Web-Unit-Tests. Erst als pass werten, wenn der lokale Lauf belegt ist."
            : "Web unit tests. Treat as pass only when a local run is recorded."}
        />
      ),
    },
    {
      id: "build",
      label: "Build web",
      content: (
        <DetailPanel
          label="Build web"
          value={locale === "de" ? "Evidenz offen" : "Evidence pending"}
          tone="partial"
          command="npm run build:web"
          detail={locale === "de"
            ? "Web-Build-Gate. Erst als pass werten, wenn der lokale Lauf belegt ist."
            : "Web build gate. Treat as pass only when a local run is recorded."}
        />
      ),
    },
    {
      id: "browser",
      label: "Browser suite",
      content: (
        <DetailPanel
          label="Browser suite"
          value={locale === "de" ? "Lokales Gate" : "Local gate"}
          tone="partial"
          command="npm run test:browser"
          detail={locale === "de"
            ? "Browser-Integrationstests. Erfordert lokale Preview."
            : "Browser integration tests. Requires local preview."}
        />
      ),
    },
    {
      id: "evidence-log",
      label: locale === "de" ? "Log" : "Log",
      content: (
        <div className="perf-detail-panel" data-testid="performance-backend-card">
          <div className="perf-detail-panel-header">
            <span className="perf-detail-panel-kicker">PERFORMANCE · LOG</span>
          </div>
          <p className="perf-detail-panel-detail" data-testid="performance-backend-summary">
            {locale === "de"
              ? "Performance-Evidenz ist lokal. Backend-Status wird separat angezeigt. Produktions- und Preview-Status bleiben außerhalb dieser Fläche."
              : "Performance evidence is local. Backend status shown separately. Production and preview status stay outside this surface until CI evidence proves them."}
          </p>
        </div>
      ),
    },
  ];

  return (
    <section className="workspace-panel performance-workspace" data-testid="performance-workspace">
      <SwipeDeck
        panels={panels}
        ariaLabel={locale === "de" ? "Performance-Evidenz" : "Performance evidence"}
        className="performance-swipe-deck"
      />
    </section>
  );
}
