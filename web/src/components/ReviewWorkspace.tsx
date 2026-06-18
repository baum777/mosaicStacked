import React, { useCallback, useMemo, useState } from "react";
import {
  ApprovalTransitionCard,
  DecisionZone,
  ExecutionReceiptCard,
  ProposalCard,
} from "./ApprovalPrimitives.js";
import { GuideOverlay, getWorkspaceGuide } from "./GuideOverlay.js";
import { StatusPanel } from "./StatusPanel.js";
import { getReviewStatusLabel, useLocalization, type Locale, type WorkspaceMode } from "../lib/localization.js";
import type { WorkMode } from "../lib/work-mode.js";

export type ReviewItemStatus = "pending_review" | "approved" | "failed" | "rejected" | "stale" | "executed";

export type ReviewItem = {
  id: string;
  source: "github" | "matrix";
  title: string;
  summary: string;
  status: ReviewItemStatus;
  stale?: boolean;
  sourceLabel?: string;
  provenanceRows?: Array<{
    label: string;
    value: string;
  }>;
};

type ReviewWorkspaceProps = {
  items: ReviewItem[];
  expertMode: boolean;
  workMode?: WorkMode;
  locale?: Locale;
  onTelemetry?: (kind: "info" | "warning" | "error", label: string, detail?: string) => void;
  onNavigateToWorkspace?: (mode: WorkspaceMode) => void;
};

const REVIEW_STATUS_PRIORITY: Record<ReviewItemStatus, number> = {
  stale: 0,
  pending_review: 1,
  approved: 2,
  failed: 3,
  rejected: 4,
  executed: 5,
};

export function prioritizeReviewItems(items: ReviewItem[]) {
  return items.slice().sort((left, right) => {
    const priorityDelta = REVIEW_STATUS_PRIORITY[left.status] - REVIEW_STATUS_PRIORITY[right.status];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const sourceDelta = left.source.localeCompare(right.source);
    if (sourceDelta !== 0) {
      return sourceDelta;
    }

    return left.title.localeCompare(right.title);
  });
}

export function describeReviewNextStep(items: ReviewItem[], locale: Locale = "en") {
  const labels = locale === "de"
    ? {
        empty: "Keine offenen Prüfungen",
        stale: "Veraltete Prüfung erneuern",
        pending: "Freigabe prüfen",
        approved: "Ausführung beobachten",
        failed: "Fehlgeschlagene Ausführung prüfen",
        rejected: "Terminale Abweichung prüfen",
        executed: "Erledigte Ausführungen prüfen",
        ready: "Bereit",
      }
    : {
        empty: "No open reviews",
        stale: "Refresh stale review",
        pending: "Check approval",
        approved: "Watch execution",
        failed: "Inspect failed execution",
        rejected: "Check terminal deviation",
        executed: "Review completed executions",
        ready: "Ready",
      };

  if (items.length === 0) {
    return labels.empty;
  }

  if (items.some((item) => item.status === "stale")) {
    return labels.stale;
  }

  if (items.some((item) => item.status === "pending_review")) {
    return labels.pending;
  }

  if (items.some((item) => item.status === "approved")) {
    return labels.approved;
  }

  if (items.some((item) => item.status === "failed")) {
    return labels.failed;
  }

  if (items.some((item) => item.status === "rejected")) {
    return labels.rejected;
  }

  if (items.some((item) => item.status === "executed")) {
    return labels.executed;
  }

  return labels.ready;
}

function getReviewWorkspaceCopy(locale: Locale) {
  return locale === "de"
    ? {
        approveIntent: "Freigabeabsicht setzen",
        rejectIntent: "Ablehnungsabsicht setzen",
        approvedIntent: "Freigabeabsicht lokal markiert",
        rejectedIntent: "Ablehnungsabsicht lokal markiert",
        decisionHelper: "Browser markiert nur Review-Intent. Backend-Ausführung bleibt im Ursprungsworkspace.",
        backendBoundary: "Backend-Ausführung bleibt im Ursprungsworkspace.",
        openWorkbench: "Workbench öffnen",
        openMatrix: "Matrix öffnen",
        openEvidence: "Evidence öffnen",
        decision: "Entscheidung",
      }
    : {
        approveIntent: "Approve intent",
        rejectIntent: "Reject intent",
        approvedIntent: "Approval intent marked locally",
        rejectedIntent: "Rejection intent marked locally",
        decisionHelper: "Browser marks review intent only. Backend execution stays in the originating workspace.",
        backendBoundary: "Backend execution stays in the originating workspace.",
        openWorkbench: "Open Workbench",
        openMatrix: "Open Matrix",
        openEvidence: "Open Evidence",
        decision: "Decision",
      };
}

export function ReviewWorkspace({
  items,
  expertMode,
  onTelemetry,
  onNavigateToWorkspace,
}: ReviewWorkspaceProps) {
  const { locale, copy: ui } = useLocalization();
  const localCopy = getReviewWorkspaceCopy(locale);
  const [localDecisions, setLocalDecisions] = useState<Record<string, "approved" | "rejected">>({});
  const prioritizedItems = useMemo(() => prioritizeReviewItems(items), [items]);
  const primaryItem = prioritizedItems[0] ?? null;
  const countLabel =
    items.length === 0 ? ui.common.none : String(items.length);
  const sourceLabelFor = (item: ReviewItem) =>
    item.sourceLabel ?? (item.source === "github" ? ui.shell.workspaceTabs.workbench.label : ui.shell.workspaceTabs.matrix.label);
  const provenanceRowsFor = (item: ReviewItem) => item.provenanceRows ?? [];
  const primaryMetadata = primaryItem
    ? [
        { label: ui.review.panelTitle, value: sourceLabelFor(primaryItem) },
        { label: ui.review.rowClassification, value: getReviewStatusLabel(locale, primaryItem.status) },
        ...provenanceRowsFor(primaryItem),
      ]
    : [];

  const markDecision = useCallback((item: ReviewItem, decision: "approved" | "rejected") => {
    setLocalDecisions((current) => ({ ...current, [item.id]: decision }));
    onTelemetry?.(
      decision === "approved" ? "info" : "warning",
      decision === "approved" ? localCopy.approvedIntent : localCopy.rejectedIntent,
      `${item.source}:${item.id}`,
    );
  }, [localCopy.approvedIntent, localCopy.rejectedIntent, onTelemetry]);

  const navigateToOrigin = useCallback((item: ReviewItem) => {
    onNavigateToWorkspace?.(item.source === "github" ? "workbench" : "matrix");
  }, [onNavigateToWorkspace]);

  const renderReviewActions = (item: ReviewItem) => {
    const localDecision = localDecisions[item.id] ?? null;
    const canDecide = item.status === "pending_review" || item.status === "stale";
    return (
      <div className="review-workspace-actions">
        {canDecide ? (
          <DecisionZone
            approveLabel={localCopy.approveIntent}
            rejectLabel={localCopy.rejectIntent}
            onApprove={() => markDecision(item, "approved")}
            onReject={() => markDecision(item, "rejected")}
            helperText={localDecision === "approved"
              ? localCopy.approvedIntent
              : localDecision === "rejected"
                ? localCopy.rejectedIntent
                : localCopy.decisionHelper}
            testId={`review-decision-zone-${item.id}`}
          />
        ) : null}
        <div className="action-row">
          <button type="button" className="secondary-button" onClick={() => navigateToOrigin(item)}>
            {item.source === "github" ? localCopy.openWorkbench : localCopy.openMatrix}
          </button>
          <button type="button" className="secondary-button" onClick={() => onNavigateToWorkspace?.("evidence")}>
            {localCopy.openEvidence}
          </button>
        </div>
        <p className="shell-muted-copy">{localCopy.backendBoundary}</p>
      </div>
    );
  };

  return (
    <section className="workspace-panel review-workspace" data-testid="review-workspace">
      <section className="workspace-hero">
        <div>
          <p className="status-pill status-partial">{ui.review.heroStatus}</p>
          <h1>{ui.review.title}</h1>
          {expertMode ? <p className="hero-copy">{ui.review.intro}</p> : null}
          <div className="workspace-hero-actions">
            <GuideOverlay content={getWorkspaceGuide(locale, "review")} testId="guide-review" />
          </div>
        </div>
      </section>

      <StatusPanel
        title={ui.review.panelTitle}
        headline={countLabel}
        badge={items.length === 0 ? ui.review.panelBadgeEmpty : ui.review.panelBadgeActive}
        badgeTone={items.length === 0 ? "partial" : "ready"}
        rows={[
          { label: ui.review.rowOpen, value: String(items.length) },
          {
            label: ui.review.nextStepLabel,
            value: describeReviewNextStep(items, locale),
          },
          {
            label: ui.review.panelTitle,
            value: primaryItem ? `${sourceLabelFor(primaryItem)} · ${getReviewStatusLabel(locale, primaryItem.status)}` : ui.common.na,
          },
        ]}
        safetyTitle={ui.review.panelTitle}
        safetyText={expertMode ? ui.review.intro : ui.review.emptyBody}
        expertMode={expertMode}
        expertRows={[
          {
            label: locale === "de" ? "Laufzeitspur" : "Runtime trace",
            value: items.map((item) => `${item.source}:${item.id}`).join(" · ") || ui.common.na,
          },
          {
            label: locale === "de" ? "Backend-Route" : "Backend route",
            value: items.length === 0
              ? (locale === "de" ? "Keine offenen Routen" : "No open routes")
              : (locale === "de" ? "Offene Vorschläge vorhanden" : "Open proposals available"),
          },
          {
            label: locale === "de" ? "Primärer Eintrag" : "Primary item",
            value: primaryItem ? `${primaryItem.source}:${getReviewStatusLabel(locale, primaryItem.status)}` : ui.common.na,
          },
        ]}
      />

      {items.length === 0 ? (
        <article className="empty-state-card">
          <div className="empty-state-card-copy">
            <p className="info-label">{ui.review.heroStatus}</p>
            <h2>{ui.review.emptyTitle}</h2>
            <p>{ui.review.emptyBody}</p>
          </div>
        </article>
      ) : (
        <div className="review-list">
          {primaryItem ? (
            primaryItem.status === "executed" ? (
              <ExecutionReceiptCard
                key={primaryItem.id}
                title={primaryItem.title}
                detail={primaryItem.summary}
                outcome="executed"
                metadata={primaryMetadata}
                testId="review-primary-executed"
              />
            ) : primaryItem.status === "failed" ? (
              <ExecutionReceiptCard
                key={primaryItem.id}
                title={primaryItem.title}
                detail={primaryItem.summary}
                outcome="failed"
                metadata={primaryMetadata}
                testId="review-primary-failed"
              />
            ) : primaryItem.status === "rejected" ? (
              <ExecutionReceiptCard
                key={primaryItem.id}
                title={primaryItem.title}
                detail={primaryItem.summary}
                outcome="rejected"
                metadata={primaryMetadata}
                testId="review-primary-rejected"
              />
            ) : primaryItem.status === "approved" ? (
              <ApprovalTransitionCard
                key={primaryItem.id}
                title={primaryItem.title}
                detail={primaryItem.summary}
                testId="review-primary-approved"
              />
            ) : (
              <ProposalCard
                key={primaryItem.id}
                testId="review-primary-proposal"
                title={primaryItem.title}
                summary={primaryItem.summary}
                consequence={expertMode ? ui.review.intro : ui.review.approvalNeeded}
                statusLabel={primaryItem.stale ? ui.review.warning : ui.review.approvalNeeded}
                statusTone={primaryItem.stale ? "error" : "partial"}
                metadata={primaryMetadata}
              >
                {renderReviewActions(primaryItem)}
              </ProposalCard>
            )
          ) : null}

          <section className="workspace-card review-queue-card">
            <header className="card-header">
              <div>
                <span>{ui.review.queueTitle}</span>
                <strong>{ui.review.queueHeader}</strong>
              </div>
            </header>

            <div className="review-queue-list">
              {prioritizedItems.map((item) => (
                <article key={item.id} className="review-queue-item">
                  <div className="review-queue-item-header">
                    <div>
                      <span>{sourceLabelFor(item)}</span>
                      <strong>{item.title}</strong>
                    </div>
                    <span className={`status-pill ${item.status === "stale" || item.status === "rejected" || item.status === "failed" ? "status-error" : item.status === "executed" ? "status-ready" : "status-partial"}`}>
                      {getReviewStatusLabel(locale, item.status)}
                    </span>
                  </div>
                  <p>{item.summary}</p>
                  {provenanceRowsFor(item).length > 0 ? (
                    <div className="review-queue-item-provenance">
                      {provenanceRowsFor(item).map((row) => (
                        <p key={`${item.id}-${row.label}`}>
                          <span>{row.label}</span>
                          <strong>{row.value}</strong>
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {item.stale ? <p className="warning-banner" role="status">{ui.review.warning}</p> : null}
                  <div className="review-queue-item-actions">
                    <button type="button" className="secondary-button" onClick={() => navigateToOrigin(item)}>
                      {item.source === "github" ? localCopy.openWorkbench : localCopy.openMatrix}
                    </button>
                    <button type="button" className="secondary-button" onClick={() => onNavigateToWorkspace?.("evidence")}>
                      {localCopy.openEvidence}
                    </button>
                    {localDecisions[item.id] ? (
                      <p className="shell-muted-copy">
                        <span>{localCopy.decision}: </span>
                        <strong>{localDecisions[item.id] === "approved" ? localCopy.approvedIntent : localCopy.rejectedIntent}</strong>
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
