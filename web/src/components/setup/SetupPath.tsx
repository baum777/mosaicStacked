import React from "react";
import { useLocalization } from "../../lib/localization.js";
import { StatusBadge } from "../ShellPrimitives.js";

export type SetupStepStatus = "ready" | "blocked" | "optional";

export type SetupStep = {
  id: string;
  label: string;
  hint: string;
  status: SetupStepStatus;
  testId: string;
};

export type SetupPathProps = {
  steps: SetupStep[];
  onPrimaryAction: () => void;
  onSecondaryAction: () => void;
  testId?: string;
};

export function SetupPath({ steps, onPrimaryAction, onSecondaryAction, testId }: SetupPathProps) {
  const { copy: ui, locale } = useLocalization();
  const primaryStep = steps.find((step) => step.status === "blocked") ?? null;
  const primaryLabel = primaryStep
    ? `${ui.chat.setupPath.primaryAction}: ${primaryStep.label}`
    : ui.chat.setupPath.primaryAction;
  const primaryTestId = primaryStep
    ? `setup-step-primary-${primaryStep.id}`
    : "setup-step-primary";

  return (
    <section
      className="setup-path"
      role="region"
      aria-label={ui.chat.setupPath.title}
      data-testid={testId ?? "setup-path"}
      data-locale={locale}
    >
      <header className="setup-path-header">
        <strong>{ui.chat.setupPath.title}</strong>
        <p>{ui.chat.setupPath.intro}</p>
      </header>
      <ol className="setup-path-list">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`setup-path-item setup-path-item-${step.status}`}
            data-testid={step.testId}
            data-step-status={step.status}
          >
            <div className="setup-path-item-marker" aria-hidden="true">
              {step.status === "ready" ? "✓" : step.status === "blocked" ? "→" : "○"}
            </div>
            <div className="setup-path-item-body">
              <div className="setup-path-item-label">
                <strong>{step.label}</strong>
                <StatusBadge tone={step.status === "ready" ? "ready" : step.status === "blocked" ? "partial" : "muted"}>
                  {step.status === "ready"
                    ? ui.chat.setupPath.statusReady
                    : step.status === "blocked"
                      ? ui.chat.setupPath.statusBlocked
                      : ui.chat.setupPath.statusOptional}
                </StatusBadge>
              </div>
              <p>{step.hint}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="setup-path-actions">
        <button
          type="button"
          className="primary-button setup-path-primary"
          onClick={onPrimaryAction}
          data-testid={primaryTestId}
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          className="ghost-button setup-path-secondary"
          onClick={onSecondaryAction}
          data-testid="setup-step-secondary"
        >
          {ui.chat.setupPath.secondaryAction}
        </button>
      </div>
    </section>
  );
}
