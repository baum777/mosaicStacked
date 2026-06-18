import React from "react";
import { useLocalization } from "../lib/localization.js";
import { recordShellTelemetry } from "../lib/shell-telemetry.js";

export type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackHint?: string;
  fallbackAction?: string;
  onError?: (error: Error, info: React.ErrorInfo) => void;
};

export type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export function resolveErrorMessage(error: Error | null) {
  if (!error) {
    return "";
  }
  return error.message || error.name || "Unknown error";
}

export function ErrorFallback({
  error,
  title,
  hint,
  action,
  onReload
}: {
  error: Error | null;
  title: string;
  hint: string;
  action: string;
  onReload: () => void;
}) {
  return (
    <section
      className="workspace-error-boundary"
      role="alert"
      aria-live="assertive"
      data-testid="workspace-error-boundary"
    >
      <h2 className="workspace-error-boundary-title">{title}</h2>
      <p className="workspace-error-boundary-hint">{hint}</p>
      {error?.message ? (
        <pre className="workspace-error-boundary-detail" data-testid="workspace-error-boundary-detail">
          {resolveErrorMessage(error)}
        </pre>
      ) : null}
      <button
        type="button"
        className="secondary-button"
        onClick={onReload}
        data-testid="workspace-error-boundary-reload"
      >
        {action}
      </button>
    </section>
  );
}

function ErrorFallbackBridge({ error, fallbackTitle, fallbackHint, fallbackAction }: ErrorBoundaryProps & { error: Error | null }) {
  const { locale } = useLocalization();
  const title = fallbackTitle ?? (locale === "de" ? "Arbeitsfläche konnte nicht geladen werden" : "Workspace failed to load");
  const hint = fallbackHint ?? (locale === "de"
    ? "Der Code-Chunk konnte nicht geladen werden. Versuche, die Konsole neu zu laden."
    : "A workspace code chunk failed to load. Reload to recover.");
  const action = fallbackAction ?? (locale === "de" ? "Neu laden" : "Reload to recover");

  return (
    <ErrorFallback
      error={error}
      title={title}
      hint={hint}
      action={action}
      onReload={() => {
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }}
    />
  );
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    recordShellTelemetry({
      kind: "error",
      label: "Workspace chunk failed to load",
      detail: `${resolveErrorMessage(error)} :: ${info.componentStack ?? ""}`.trim()
    });
    this.props.onError?.(error, info);
  }

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return <ErrorFallbackBridge error={this.state.error} {...this.props} />;
  }
}
