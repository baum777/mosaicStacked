import type { PointerEventHandler, ReactNode } from "react";
import React from "react";

export type MobileHealthTone = "ready" | "partial" | "error";

function SettingsGearIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 8.5A3.5 3.5 0 1 1 12 15.5A3.5 3.5 0 0 1 12 8.5Z" />
      <path d="M4.5 12a7.5 7.5 0 0 1 .2-1.7l2-.4a6.7 6.7 0 0 1 .8-1.3l-1.2-1.7a8 8 0 0 1 2.4-2.4l1.7 1.2c.4-.3.9-.6 1.3-.8l.4-2A7.5 7.5 0 0 1 12 4.5c.6 0 1.1.1 1.7.2l.4 2c.5.2 1 .5 1.3.8l1.7-1.2a8 8 0 0 1 2.4 2.4l-1.2 1.7c.3.4.6.9.8 1.3l2 .4a7.5 7.5 0 0 1 0 3.4l-2 .4c-.2.5-.5 1-.8 1.3l1.2 1.7a8 8 0 0 1-2.4 2.4l-1.7-1.2c-.4.3-.9.6-1.3.8l-.4 2a7.5 7.5 0 0 1-3.4 0l-.4-2c-.5-.2-1-.5-1.3-.8l-1.7 1.2a8 8 0 0 1-2.4-2.4l1.2-1.7c-.3-.4-.6-.9-.8-1.3l-2-.4A7.5 7.5 0 0 1 4.5 12Z" />
    </svg>
  );
}

export function TopContextBar({
  brandIcon,
  title,
  modelAlias,
  healthTone,
  locale,
  brandAriaLabel,
  modelAriaLabel,
  languageAriaLabel,
  languageOptionEnglish,
  languageOptionGerman,
  settingsAriaLabel,
  onBrandClick,
  onBrandPointerCancel,
  onBrandPointerDown,
  onBrandPointerLeave,
  onBrandPointerUp,
  onModelPress,
  onLocaleChange,
  onSettingsPress,
}: {
  brandIcon: ReactNode;
  title: string;
  modelAlias: string;
  healthTone: MobileHealthTone;
  locale: "en" | "de";
  brandAriaLabel: string;
  modelAriaLabel: string;
  languageAriaLabel: string;
  languageOptionEnglish: string;
  languageOptionGerman: string;
  settingsAriaLabel: string;
  onBrandClick: () => void;
  onBrandPointerCancel: PointerEventHandler<HTMLButtonElement>;
  onBrandPointerDown: PointerEventHandler<HTMLButtonElement>;
  onBrandPointerLeave: PointerEventHandler<HTMLButtonElement>;
  onBrandPointerUp: PointerEventHandler<HTMLButtonElement>;
  onModelPress: () => void;
  onLocaleChange: (locale: "en" | "de") => void;
  onSettingsPress: () => void;
}) {
  return (
    <header className="mobile-topbar">
      <button
        type="button"
        className="mobile-brand-button"
        onPointerDown={onBrandPointerDown}
        onPointerUp={onBrandPointerUp}
        onPointerCancel={onBrandPointerCancel}
        onPointerLeave={onBrandPointerLeave}
        onClick={onBrandClick}
        aria-label={brandAriaLabel}
      >
        <span className="mosaicstacked-mark" aria-hidden="true">
          {brandIcon}
        </span>
        <span>{title}</span>
      </button>

      <div className="mobile-topbar-actions">
        <button
          type="button"
          className="secondary-button mobile-model-badge"
          onClick={onModelPress}
          aria-label={modelAriaLabel}
        >
          {modelAlias}
        </button>
        <button
          type="button"
          className="secondary-button mobile-settings-button"
          onClick={onSettingsPress}
          aria-label={settingsAriaLabel}
          data-testid="mobile-settings-button"
        >
          <SettingsGearIcon />
        </button>
        <div className="shell-language-toggle" role="group" aria-label={languageAriaLabel}>
          <button
            type="button"
            className={locale === "en" ? "secondary-button shell-language-button shell-language-button-active" : "secondary-button shell-language-button"}
            onClick={() => onLocaleChange("en")}
            aria-pressed={locale === "en"}
            aria-label={locale === "de" ? "Sprache: Englisch" : "Language: English"}
            data-testid="locale-en"
          >
            {languageOptionEnglish}
          </button>
          <button
            type="button"
            className={locale === "de" ? "secondary-button shell-language-button shell-language-button-active" : "secondary-button shell-language-button"}
            onClick={() => onLocaleChange("de")}
            aria-pressed={locale === "de"}
            aria-label={locale === "de" ? "Sprache: Deutsch" : "Language: German"}
            data-testid="locale-de"
          >
            {languageOptionGerman}
          </button>
        </div>
        <span className={`mobile-live-indicator mobile-live-indicator-${healthTone}`} aria-hidden="true" />
      </div>
    </header>
  );
}
