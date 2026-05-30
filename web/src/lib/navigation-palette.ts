import type { WorkspaceMode } from "./localization.js";

export type NavigationPaletteEntry = {
  id: string;
  kind: "tab" | "session" | "appearance" | "action";
  group: string;
  label: string;
  detail: string;
  mode: WorkspaceMode;
  onSelect: () => void;
};
