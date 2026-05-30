import React from "react";
import { useLocalization } from "../lib/localization.js";
import { SectionLabel, StatusBadge } from "./ShellPrimitives.js";

type MetricTone = "ready" | "partial" | "error";

type PerfMetric = {
  label: string;
  value: string;
  detail: string;
  tone: MetricTone;
  points: string;
};

type WorkflowStep = {
  label: string;
  command: string;
  status: string;
  tone: MetricTone;
  width: number;
};

const metrics: PerfMetric[] = [
  {
    label: "LCP",
    value: "1.1 s",
    detail: "Reference from docs/lighthouse-report.json, local evidence only",
    tone: "ready",
    points: "0,18 12,14 24,16 36,11 48,9 60,10 72,7 84,9 100,6",
  },
  {
    label: "CLS",
    value: "0.03",
    detail: "Reference from docs/lighthouse-report.json, local evidence only",
    tone: "ready",
    points: "0,12 12,12 24,11 36,14 48,12 60,11 72,12 84,13 100,11",
  },
  {
    label: "TTI",
    value: "2.0 s",
    detail: "Checked by npm run perf:lighthouse:tti against local preview",
    tone: "ready",
    points: "0,17 12,15 24,14 36,12 48,13 60,10 72,9 84,10 100,8",
  },
  {
    label: "Bundle",
    value: "budgeted",
    detail: "Checked by npm run perf:bundle:web",
    tone: "partial",
    points: "0,11 12,10 24,12 36,10 48,11 60,9 72,11 84,8 100,9",
  },
];

const workflowSteps: WorkflowStep[] = [
  {
    label: "Typecheck web",
    command: "npm run typecheck:web",
    status: "local gate",
    tone: "ready",
    width: 35,
  },
  {
    label: "Unit web",
    command: "npm run test:web",
    status: "local gate",
    tone: "ready",
    width: 48,
  },
  {
    label: "Build web",
    command: "npm run build:web",
    status: "local gate",
    tone: "ready",
    width: 62,
  },
  {
    label: "Browser suite",
    command: "npm run test:browser",
    status: "local browser gate",
    tone: "partial",
    width: 78,
  },
  {
    label: "Bundle budget",
    command: "npm run perf:bundle:web",
    status: "performance gate",
    tone: "partial",
    width: 92,
  },
];

function toneLabel(tone: MetricTone) {
  if (tone === "ready") {
    return "pass";
  }

  if (tone === "error") {
    return "blocked";
  }

  return "partial";
}

export function PerformanceWorkspace() {
  const { locale } = useLocalization();
  const copy = locale === "de"
    ? {
        kicker: "PERFORMANCE",
        title: "Lokale Performance-Gates",
        body: "Diese Fläche zeigt lokale Evidenz und Repo-Gates. Sie behauptet keine Live-CI, kein Deployment und keine Produktions-Telemetrie.",
        vitals: "Core Web Vitals",
        workflow: "Lokaler Gate-Workflow",
        deploy: "Deploy-Hinweis",
        deployBody: "Production- und Preview-Status bleiben außerhalb dieser Browserfläche, bis Backend- oder CI-Evidenz sie belegt.",
        status: "Evidenz",
      }
    : {
        kicker: "PERFORMANCE",
        title: "Local performance gates",
        body: "This surface shows local evidence and repo gates. It does not claim live CI, deployment, or production telemetry.",
        vitals: "Core Web Vitals",
        workflow: "Local gate workflow",
        deploy: "Deploy note",
        deployBody: "Production and preview status stay outside this browser surface until backend or CI evidence proves them.",
        status: "Evidence",
      };

  return (
    <section className="workspace-panel performance-workspace" data-testid="performance-workspace">
      <article className="workspace-card performance-hero-card">
        <header className="card-header">
          <div>
            <span>{copy.kicker}</span>
            <strong>{copy.title}</strong>
          </div>
          <StatusBadge tone="partial">{copy.status}: partial</StatusBadge>
        </header>
        <p className="muted-copy">{copy.body}</p>
      </article>

      <article className="workspace-card performance-metric-card">
        <header className="card-header">
          <div>
            <span>{copy.kicker}</span>
            <strong>{copy.vitals}</strong>
          </div>
        </header>
        <div className="performance-metric-grid">
          {metrics.map((metric) => (
            <div className={`performance-metric performance-metric-${metric.tone}`} key={metric.label}>
              <div className="performance-metric-topline">
                <span>{metric.label}</span>
                <StatusBadge tone={metric.tone}>{toneLabel(metric.tone)}</StatusBadge>
              </div>
              <strong>{metric.value}</strong>
              <p>{metric.detail}</p>
              <svg viewBox="0 0 100 22" preserveAspectRatio="none" aria-hidden="true">
                <polyline points={metric.points} />
              </svg>
            </div>
          ))}
        </div>
      </article>

      <article className="workspace-card performance-workflow-card">
        <header className="card-header">
          <div>
            <span>{copy.kicker}</span>
            <strong>{copy.workflow}</strong>
          </div>
        </header>
        <div className="performance-workflow-list">
          {workflowSteps.map((step) => (
            <div className={`performance-step performance-step-${step.tone}`} key={step.command}>
              <div className="performance-step-icon" aria-hidden="true">{step.tone === "ready" ? "✓" : "•"}</div>
              <div className="performance-step-copy">
                <strong>{step.label}</strong>
                <code>{step.command}</code>
              </div>
              <div className="performance-step-bar" aria-hidden="true">
                <span style={{ width: `${step.width}%` }} />
              </div>
              <small>{step.status}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="workspace-card performance-note-card">
        <SectionLabel>{copy.deploy}</SectionLabel>
        <p className="muted-copy">{copy.deployBody}</p>
      </article>
    </section>
  );
}
