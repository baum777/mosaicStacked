import React, { useCallback, useEffect, useState } from "react";
import { useLocalization } from "../lib/localization.js";
import { hasSeenGuideKey, markGuideKeySeen } from "../lib/guide-state.js";
import {
  LANDING_ACTION_BUTTONS,
  LANDING_ACTION_RECIPES,
  LANDING_BEGINNER_FLOW,
  LANDING_COPY,
  LANDING_FEATURES,
  LANDING_MODEL_STEPS,
  LANDING_POWER_RECIPES,
  type LandingFeatureKey,
} from "./landing-copy.js";

const LANDING_ENTRY_GUIDE_KEY = "landing-entry";

type LandingFeature = (typeof LANDING_FEATURES)[number] & { key: LandingFeatureKey };

function WorkspaceIconForFeature({ mode }: { mode: LandingFeatureKey }) {
  switch (mode) {
    case "chat":
      return (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H9l-4 4v-4.5A2.5 2.5 0 0 1 5 13V6.5Z" />
          <path d="M8 8.5h8" />
          <path d="M8 11.5h5.5" />
        </svg>
      );
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
  }
}

function MosaicStackedIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.2 19.2 7.4v9.2L12 20.8 4.8 16.6V7.4Z" />
      <path d="m12 7 3.8 2.2v4.6L12 16l-3.8-2.2V9.2Z" />
    </svg>
  );
}

export function LandingEntryGate({
  locale,
  open,
  onAccept,
  onDismiss,
}: {
  locale: "de" | "en";
  open: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  if (!open) {
    return null;
  }

  const copy = LANDING_COPY[locale];

  return (
    <div className="landing-entry-backdrop" role="presentation" onPointerDown={onDismiss}>
      <section
        className="landing-entry-dialog shell-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="landing-entry-title"
        aria-describedby="landing-entry-body"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="landing-entry-dialog-header">
          <div className="landing-entry-dialog-copy">
            <p className="landing-entry-dialog-kicker">{copy.kicker}</p>
            <h2 id="landing-entry-title">{copy.entryGateTitle}</h2>
          </div>
          <button
            type="button"
            className="ghost-button landing-entry-dismiss"
            aria-label={locale === "de" ? "Dialog schließen" : "Close dialog"}
            onClick={onDismiss}
          >
            ×
          </button>
        </header>
        <p id="landing-entry-body" className="landing-entry-dialog-body">
          {copy.entryGateBody}
        </p>
        <div className="landing-entry-path">
          <span>{copy.entryGatePathLabel}</span>
          <code>/console</code>
        </div>
        <div className="landing-entry-actions">
          <button type="button" className="landing-cta-primary" onClick={onAccept}>
            {copy.entryGatePrimary}
          </button>
          <button type="button" className="landing-cta-secondary" onClick={onDismiss}>
            {copy.entryGateSecondary}
          </button>
        </div>
      </section>
    </div>
  );
}

export function useLandingEntryGate() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return !hasSeenGuideKey(LANDING_ENTRY_GUIDE_KEY);
  });
  const [redirecting, setRedirecting] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return hasSeenGuideKey(LANDING_ENTRY_GUIDE_KEY);
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (hasSeenGuideKey(LANDING_ENTRY_GUIDE_KEY)) {
      setRedirecting(true);
      window.location.replace("/console");
      return;
    }

    setOpen(true);
  }, []);

  const accept = useCallback(() => {
    setRedirecting(true);
    markGuideKeySeen(LANDING_ENTRY_GUIDE_KEY);
    window.location.replace("/console");
  }, []);

  return {
    open,
    setOpen,
    accept,
    redirecting,
  };
}

export function LandingPage() {
  const { locale, setLocale, copy: ui } = useLocalization();
  const landingCopy = LANDING_COPY[locale];

  return (
    <main className="app-shell landing-shell" data-testid="readme-landing">
      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <div className="landing-hero-top">
          <div className="landing-brand-row">
            <span className="mosaicstacked-mark" aria-hidden="true">
              <MosaicStackedIcon />
            </span>
            <span>MosaicStacked</span>
          </div>
          <div className="shell-language-toggle landing-language-toggle" role="group" aria-label={ui.shell.languageLabel}>
            <button
              type="button"
              className={locale === "en" ? "secondary-button shell-language-button shell-language-button-active" : "secondary-button shell-language-button"}
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
              aria-label={locale === "de" ? "Sprache: Englisch" : "Language: English"}
              data-testid="landing-locale-en"
            >
              {ui.shell.languageOptionEnglish}
            </button>
            <button
              type="button"
              className={locale === "de" ? "secondary-button shell-language-button shell-language-button-active" : "secondary-button shell-language-button"}
              onClick={() => setLocale("de")}
              aria-pressed={locale === "de"}
              aria-label={locale === "de" ? "Sprache: Deutsch" : "Language: German"}
              data-testid="landing-locale-de"
            >
              {ui.shell.languageOptionGerman}
            </button>
          </div>
        </div>
        <p className="landing-kicker">{landingCopy.kicker}</p>
        <h1 id="landing-hero-title">{landingCopy.heroTitle}</h1>
        <p className="landing-hero-copy">
          {landingCopy.heroBody}
        </p>
        <div className="landing-hero-actions">
          <a className="landing-cta-primary" href="/console">
            {landingCopy.heroPrimaryCta}
          </a>
          <a className="landing-cta-secondary" href="#so-funktionierts">
            {landingCopy.heroSecondaryCta}
          </a>
        </div>
      </section>

      <section className="landing-section" id="so-funktionierts" aria-labelledby="landing-features-title">
        <header className="landing-section-header">
          <p className="landing-section-kicker">{landingCopy.workspaceTabsKicker}</p>
          <h2 id="landing-features-title">{landingCopy.workspaceTabsTitle}</h2>
        </header>
        <div className="landing-feature-grid">
          {LANDING_FEATURES.map((feature) => (
            <article className="landing-card" key={feature.key}>
              <div className="landing-card-icon" aria-hidden="true">
                <WorkspaceIconForFeature mode={feature.key as LandingFeatureKey} />
              </div>
              <h3>{feature.title[locale]}</h3>
              <p>{feature.description[locale]}</p>
              <p className="landing-card-note">{feature.useCase[locale]}</p>
              <a href={feature.href}>{feature.title[locale]} {landingCopy.openSuffix}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="landing-model-title">
        <header className="landing-section-header">
          <p className="landing-section-kicker">{landingCopy.modelKicker}</p>
          <h2 id="landing-model-title">{landingCopy.modelTitle}</h2>
          <p>
            {landingCopy.modelBody}
          </p>
        </header>
        <div className="landing-step-grid">
          {LANDING_MODEL_STEPS.map((step, index) => (
            <article className="landing-step-card" key={step.title[locale]}>
              <span className="landing-step-index">{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title[locale]}</h3>
              <p>{step.text[locale]}</p>
            </article>
          ))}
        </div>
        <p className="landing-inline-note">
          <strong>{landingCopy.modelHintLabel}</strong> {landingCopy.modelHintBody}
        </p>
        <p className="landing-inline-note">
          <code>OPENROUTER_API_KEY</code> {landingCopy.modelSecretNote}
        </p>
      </section>

      <section className="landing-section" aria-labelledby="landing-actions-title">
        <header className="landing-section-header">
          <p className="landing-section-kicker">{landingCopy.actionsKicker}</p>
          <h2 id="landing-actions-title">{landingCopy.actionsTitle}</h2>
          <p>{landingCopy.actionsBody}</p>
        </header>
        <div className="landing-action-grid">
          {LANDING_ACTION_BUTTONS.map((action) => (
            <article className="landing-card landing-card-cheatsheet" key={`${action.title}-${locale}`}>
              <h3>{action.title} {action.headline[locale]}</h3>
              <p>{action.text[locale]}</p>
            </article>
          ))}
        </div>
        <div className="landing-mini-cheatsheet">
          {LANDING_ACTION_RECIPES.map((recipe) => (
            <article className="landing-cheat-row" key={recipe.title[locale]}>
              <strong>{recipe.title[locale]}</strong>
              <p>{recipe.text[locale]}</p>
            </article>
          ))}
        </div>
        <p className="landing-inline-note">
          {landingCopy.actionsExamplePrefix} {landingCopy.actionsExampleBody} <code>⊛</code> {landingCopy.actionsExampleTail} <code>↯</code> {locale === "de" ? "vor." : "."}
        </p>
      </section>

      <section className="landing-section" aria-labelledby="landing-beginner-title">
        <header className="landing-section-header">
          <p className="landing-section-kicker">{landingCopy.beginnerKicker}</p>
          <h2 id="landing-beginner-title">{landingCopy.beginnerTitle}</h2>
        </header>
        <ol className="landing-stepper">
          {LANDING_BEGINNER_FLOW[locale].map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="landing-section" aria-labelledby="landing-power-title">
        <header className="landing-section-header">
          <p className="landing-section-kicker">{landingCopy.powerKicker}</p>
          <h2 id="landing-power-title">{landingCopy.powerTitle}</h2>
        </header>
        <div className="landing-recipe-grid">
          {LANDING_POWER_RECIPES.map((recipe) => (
            <article className="landing-card" key={recipe.title[locale]}>
              <h3>{recipe.title[locale]}</h3>
              <p>{recipe.text[locale]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-safety-note" aria-label={landingCopy.safetyLabel}>
        {landingCopy.safetyLines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </section>

      <section className="landing-enter-section" aria-label={landingCopy.enterHint}>
        <a className="landing-cta-primary landing-enter-cta" href="/console">
          {landingCopy.enterLabel}
        </a>
      </section>
    </main>
  );
}

export function PublicPreview() {
  const { locale } = useLocalization();
  const { open, setOpen, accept, redirecting } = useLandingEntryGate();

  if (redirecting) {
    return null;
  }

  return (
    <>
      <LandingPage />
      <LandingEntryGate
        locale={locale}
        open={open}
        onAccept={accept}
        onDismiss={() => setOpen(false)}
      />
    </>
  );
}

export function ReadmeLandingPage() {
  return <LandingPage />;
}

// Suppress unused-type-imports warnings.
export type { LandingFeature as _LandingFeature };
