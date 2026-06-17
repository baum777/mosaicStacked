import React from "react";

export type DesktopSidebarTabMode = "chat" | "workbench" | "matrix" | "settings" | "perf";

export type DesktopSidebarTabLabels = Record<DesktopSidebarTabMode, string>;

type DesktopSidebarTabsProps = {
  active: DesktopSidebarTabMode;
  labels: DesktopSidebarTabLabels;
  ariaLabel: string;
  onSelect: (mode: DesktopSidebarTabMode) => void;
};

const TAB_ORDER: DesktopSidebarTabMode[] = [
  "chat",
  "workbench",
  "matrix",
  "settings",
  "perf",
];

/**
 * Desktop sidebar tab list. Extracted from `App.tsx` so the contract is
 * testable in isolation and the visual regression for keyboard-only users
 * (R2 in the audit) is locked down.
 *
 * Each button renders a visible `<span class="sidebar-tab-label">` with the
 * workspace label, removing the previous `sr-only` wrapper so the tab is
 * recognisable without hover. The `aria-label` and `title` attributes stay
 * for screen-reader and tooltip fallback.
 */
export function DesktopSidebarTabs({
  active,
  labels,
  ariaLabel,
  onSelect,
}: DesktopSidebarTabsProps) {
  return (
    <nav className="sidebar-nav" aria-label={ariaLabel}>
      {TAB_ORDER.map((mode) => {
        const isActive = mode === active;
        const className = isActive
          ? "workspace-tab workspace-tab-active workspace-tab-vertical workspace-tab-shell-active"
          : "workspace-tab workspace-tab-vertical";
        return (
          <button
            key={mode}
            type="button"
            className={className}
            onClick={() => onSelect(mode)}
            aria-label={labels[mode]}
            aria-current={isActive ? "page" : undefined}
            data-testid={`tab-${mode}`}
            title={labels[mode]}
          >
            <span className={`workspace-tab-icon workspace-tab-icon-${mode}`} aria-hidden="true">
              <DesktopSidebarTabIcon mode={mode} />
            </span>
            <span className="sidebar-tab-label">{labels[mode]}</span>
          </button>
        );
      })}
    </nav>
  );
}

function DesktopSidebarTabIcon({ mode }: { mode: DesktopSidebarTabMode }) {
  switch (mode) {
    case "workbench":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M6 6.75A2.75 2.75 0 0 1 8.75 4H15l3 3v10.25A2.75 2.75 0 0 1 15.25 20H8.75A2.75 2.75 0 0 1 6 17.25V6.75Z" />
          <path d="M15 4v3h3" />
          <path d="M8.5 11.25h7" />
          <path d="M8.5 14.5h7" />
        </svg>
      );
    case "matrix":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </svg>
      );
    case "settings":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M12 8.5A3.5 3.5 0 1 1 12 15.5A3.5 3.5 0 0 1 12 8.5Z" />
          <path d="M4.5 12a7.5 7.5 0 0 1 .2-1.7l2-.4a6.7 6.7 0 0 1 .8-1.3l-1.2-1.7a8 8 0 0 1 2.4-2.4l1.7 1.2c.4-.3.9-.6 1.3-.8l.4-2A7.5 7.5 0 0 1 12 4.5c.6 0 1.1.1 1.7.2l.4 2c.5.2 1 .5 1.3.8l1.7-1.2a8 8 0 0 1 2.4 2.4l-1.2 1.7c.3.4.6.9.8 1.3l2 .4a7.5 7.5 0 0 1 0 3.4l-2 .4c-.2.5-.5 1-.8 1.3l1.2 1.7a8 8 0 0 1-2.4 2.4l-1.7-1.2c-.4.3-.9.6-1.3.8l-.4 2a7.5 7.5 0 0 1-3.4 0l-.4-2c-.5-.2-1-.5-1.3-.8l-1.7 1.2a8 8 0 0 1-2.4-2.4l1.2-1.7c-.3-.4-.6-.9-.8-1.3l-2-.4A7.5 7.5 0 0 1 4.5 12Z" />
        </svg>
      );
    case "perf":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 16.5h2.5l2-7 3 10 2.5-15 2.2 12H20" />
          <path d="M4 20h16" />
        </svg>
      );
    case "chat":
    default:
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H9l-4 4v-4.5A2.5 2.5 0 0 1 5 13V6.5Z" />
          <path d="M8 8.5h8" />
          <path d="M8 11.5h5.5" />
        </svg>
      );
  }
}
