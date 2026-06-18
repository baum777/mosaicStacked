/**
 * Settings-workspace types shared by `useSettingsWorkspaceStatus` and
 * `SettingsWorkspace`. Extracted from `SettingsWorkspace.tsx` in
 * Block F so the new hook can live under `web/src/hooks/` without
 * reaching into `web/src/components/`.
 */

export type SettingsVerificationTarget = "backend" | "github" | "matrix";

export type SettingsVerificationState = {
  status: "idle" | "checking" | "passed" | "failed";
  detail: string;
  checkedAt: string | null;
};
