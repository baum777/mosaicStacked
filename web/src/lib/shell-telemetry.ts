export type ShellTelemetryKind = "info" | "warning" | "error";

export type ShellTelemetryInput = {
  kind: ShellTelemetryKind;
  label: string;
  detail?: string;
};

export type ShellTelemetrySink = (entry: ShellTelemetryInput) => void;

let currentSink: ShellTelemetrySink | null = null;

export function registerShellTelemetrySink(sink: ShellTelemetrySink | null) {
  currentSink = sink;
}

export function recordShellTelemetry(entry: ShellTelemetryInput) {
  if (currentSink) {
    currentSink(entry);
    return;
  }

  if (typeof console !== "undefined" && entry.kind === "error") {
    console.warn(`[shell-telemetry] ${entry.label}${entry.detail ? `: ${entry.detail}` : ""}`);
  }
}
