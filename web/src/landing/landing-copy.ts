/**
 * Landing-page copy and feature/recipe data.
 *
 * Extracted from `web/src/App.tsx` in Block F so the App shell only
 * carries routing and orchestration logic. Pure data — no React
 * components, no JSX — so it can be tree-shaken independently.
 *
 * The icon JSX for `LANDING_FEATURES` is rendered inside
 * `LandingPage.tsx` (not here) so this file stays free of React
 * component references and the icon-rename scope stays small.
 */

export const LANDING_COPY = {
  de: {
    kicker: "Backend-owned Console",
    heroTitle: "MosaicStacked Konsole",
    heroBody: "Chat, Workbench, Matrix und Settings liegen in einem kontrollierten Interface mit klarer Backend-Autorität.",
    heroPrimaryCta: "Konsole öffnen",
    heroSecondaryCta: "Interface sehen",
    workspaceTabsKicker: "Arbeitsflächen",
    workspaceTabsTitle: "Vier klare Eintrittspunkte",
    openSuffix: "öffnen",
    modelKicker: "Modell verbinden",
    modelTitle: "Modellzugang in drei Schritten",
    modelBody: "Du bringst den Zugang mit, die App hält Routing, Status und Freigaben serverseitig zusammen.",
    modelHintLabel: "Hinweis:",
    modelHintBody: "Die UI zeigt Modell-Aliase. Provider-Details bleiben Backend-/Config-Sache.",
    modelSecretNote: "gehört in Settings/Backend, nie in Prompt-Text.",
    actionsKicker: "Aktionen",
    actionsTitle: "Von einer Antwort zur nächsten Aktion",
    actionsBody: "Die Oberfläche ist auf Weitergabe, Review und Freigabe gebaut - nicht auf Copy-Paste.",
    actionsExamplePrefix: "Beispiel:",
    actionsExampleBody: "Lade eine Datei -> prüfe Risiken -> übergib an Workbench mit",
    actionsExampleTail: "-> bereite einen Matrix-Entwurf mit",
    beginnerKicker: "Erste Sitzung",
    beginnerTitle: "Dein erster Ablauf",
    powerKicker: "Power User Recipes",
    powerTitle: "Abläufe für echte Projektarbeit",
    safetyLabel: "Safety-Hinweis",
    safetyLines: [
      "Browser ist Review Surface, Backend hält Autorität.",
      "Keine direkten Writes ohne Approval Gate.",
      "Matrix-Composer Submit bleibt fail-closed, bis ein Write-Contract aktiv ist.",
      "Secrets nie in Prompts posten.",
    ],
    enterLabel: "ENTER",
    enterHint: "Zur App wechseln",
    entryGateTitle: "Einmal bestätigen, dann direkt zur Konsole",
    entryGateBody: "Akzeptiere diesen Pfad einmal. Danach öffnet MosaicStacked die Konsole direkt und lässt die Landingpage aus.",
    entryGatePrimary: "Akzeptieren und öffnen",
    entryGateSecondary: "Später",
    entryGatePathLabel: "Pfad",
  },
  en: {
    kicker: "Backend-owned Console",
    heroTitle: "MosaicStacked Console",
    heroBody: "Chat, Workbench, Matrix, and Settings live in one controlled interface with backend authority.",
    heroPrimaryCta: "Open console",
    heroSecondaryCta: "See the interface",
    workspaceTabsKicker: "Workspaces",
    workspaceTabsTitle: "Four clear entry points",
    openSuffix: "open",
    modelKicker: "Connect Models",
    modelTitle: "Connect model access in three steps",
    modelBody: "You bring the access; the app keeps routing, status, and approvals server-owned.",
    modelHintLabel: "Note:",
    modelHintBody: "The UI shows model aliases. Provider details stay a backend/config concern.",
    modelSecretNote: "belongs in settings/backend, never in prompt text.",
    actionsKicker: "Actions",
    actionsTitle: "From one answer to the next action",
    actionsBody: "The surface is built for handoff, review, and approval - not for copy-paste.",
    actionsExamplePrefix: "Example:",
    actionsExampleBody: "Load a file -> review risks -> hand off to Workbench with",
    actionsExampleTail: "-> prepare a Matrix draft with",
    beginnerKicker: "First session",
    beginnerTitle: "Your first flow",
    powerKicker: "Power User Recipes",
    powerTitle: "Flows for real project work",
    safetyLabel: "Safety Note",
    safetyLines: [
      "The browser is a review surface; the backend remains authoritative.",
      "No direct writes without an approval gate.",
      "Matrix composer submit stays fail-closed until a write contract is active.",
      "Never post secrets in prompts.",
    ],
    enterLabel: "ENTER",
    enterHint: "Open the app",
    entryGateTitle: "Confirm once, then open the console directly",
    entryGateBody: "Accept this path once. After that, MosaicStacked opens the console directly and skips the landing page.",
    entryGatePrimary: "Accept and open",
    entryGateSecondary: "Later",
    entryGatePathLabel: "Path",
  },
} as const;

export type LandingFeatureKey = "chat" | "workbench" | "matrix" | "settings";

export const LANDING_FEATURES: ReadonlyArray<{
  key: LandingFeatureKey;
  href: string;
  title: { de: string; en: string };
  description: { de: string; en: string };
  useCase: { de: string; en: string };
}> = [
  {
    key: "chat",
    href: "/console?mode=chat",
    title: { de: "Chat", en: "Chat" },
    description: {
      de: "Frage Modelle, plane Tasks und lass dir Code oder Entscheidungen erklären.",
      en: "Ask models, plan tasks, and get code or decisions explained.",
    },
    useCase: {
      de: "Kurz starten: Idee eintippen und den nächsten Schritt ableiten.",
      en: "Quick start: type an idea and derive the next step.",
    },
  },
  {
    key: "workbench",
    href: "/console?mode=workbench",
    title: { de: "Workbench", en: "Workbench" },
    description: {
      de: "Lade Repo-Kontext, prüfe Änderungen und steuere Review, Übergabe und PR-Vorbereitung.",
      en: "Load repository context, review changes, and control handoff and PR preparation.",
    },
    useCase: {
      de: "Arbeitszusammenfassung prüfen und nur bei Bedarf den Raw Diff öffnen.",
      en: "Review the work summary first and open raw diff only when needed.",
    },
  },
  {
    key: "matrix",
    href: "/console?mode=matrix",
    title: { de: "Matrix", en: "Matrix" },
    description: {
      de: "Prüfe Scope, Provenienz und Topic-Update-Pläne im Backend-Flow.",
      en: "Review scope, provenance, and topic-update plans through backend flows.",
    },
    useCase: {
      de: "Scope auflösen, Plan prüfen, dann mit Freigabe ausführen und verifizieren.",
      en: "Resolve scope, review plan, then execute and verify with approval.",
    },
  },
  {
    key: "settings",
    href: "/console?mode=settings",
    title: { de: "Settings", en: "Settings" },
    description: {
      de: "Verbinde Modellzugang, GitHub und Matrix kontrolliert.",
      en: "Connect model access, GitHub, and Matrix in a controlled way.",
    },
    useCase: {
      de: "OpenRouter-Credentials prüfen und GitHub-/Matrix-Integrationen kontrolliert verbinden.",
      en: "Verify OpenRouter credentials and connect GitHub/Matrix integrations in a controlled flow.",
    },
  },
];

export const LANDING_MODEL_STEPS = [
  {
    title: {
      de: "API-Key holen",
      en: "Get API key",
    },
    text: {
      de: "Erstelle einen OpenRouter-Key und nutze ihn als Zugang zu mehreren Modellen.",
      en: "Create an OpenRouter key and use it as access to multiple models.",
    },
  },
  {
    title: {
      de: "In Mosaic eintragen",
      en: "Connect in Mosaic",
    },
    text: {
      de: "Füge den Key im Setup oder in den Settings hinzu. Secrets gehören nie in Chat-Nachrichten.",
      en: "Add the key in setup or settings. Secrets never belong in chat messages.",
    },
  },
  {
    title: {
      de: "Modell wählen",
      en: "Switch model",
    },
    text: {
      de: "Wechsle je nach Aufgabe: schnell lesen, tief prüfen oder strukturiert planen.",
      en: "Switch by task: read fast, review deeply, or plan with structure.",
    },
  },
] as const;

export const LANDING_ACTION_BUTTONS = [
  {
    title: "⊛",
    headline: {
      de: "Matrix-Entwurf vorbereiten",
      en: "Prepare Matrix draft",
    },
    text: {
      de: "Übernimmt eine Antwort in den Matrix-Workspace als Entwurf. Submit bleibt derzeit fail-closed.",
      en: "Moves a response into the Matrix workspace as a draft. Submit currently stays fail-closed.",
    },
  },
  {
    title: "↯",
    headline: {
      de: "Für GitHub vorbereiten",
      en: "Prepare for GitHub",
    },
    text: {
      de: "Übergibt einen Ausschnitt in den Workbench-Flow für Review, Vorschlag und freigabegesteuerte Ausführung.",
      en: "Hands off an excerpt into the Workbench flow for review, proposal, and approval-gated execution.",
    },
  },
  {
    title: "⊡",
    headline: {
      de: "Kontext laden",
      en: "Load context",
    },
    text: {
      de: "Ziehe Repo, Datei oder Branch in den Chat, bevor du nach Details fragst.",
      en: "Pull repo, file, or branch into chat before asking for details.",
    },
  },
  {
    title: "⎘",
    headline: {
      de: "Kopieren",
      en: "Copy",
    },
    text: {
      de: "Nutze Outputs außerhalb der App oder kombiniere sie mit Matrix und GitHub.",
      en: "Use outputs outside the app or combine them with Matrix and GitHub.",
    },
  },
] as const;

export const LANDING_ACTION_RECIPES = [
  {
    title: {
      de: "Chat → Matrix",
      en: "Chat → Matrix",
    },
    text: {
      de: "Lass dir eine Zusammenfassung erstellen, tippe ⊛ und übernimm sie als Matrix-Entwurf.",
      en: "Generate a summary, tap ⊛, and adopt it as a Matrix draft.",
    },
  },
  {
    title: {
      de: "Chat → GitHub",
      en: "Chat → GitHub",
    },
    text: {
      de: "Lass dir Review-Hinweise erstellen, tippe ↯ und bereite daraus Issue oder PR-Kommentar vor.",
      en: "Generate review hints, tap ↯, and prepare an issue or PR comment.",
    },
  },
  {
    title: {
      de: "GitHub → Chat",
      en: "GitHub → Chat",
    },
    text: {
      de: "Lade eine Datei in den Kontext und frage gezielt nach Risiken, Bugs oder Refactor-Optionen.",
      en: "Load a file into context and ask directly about risks, bugs, or refactor options.",
    },
  },
  {
    title: {
      de: "Matrix → Chat",
      en: "Matrix → Chat",
    },
    text: {
      de: "Nutze Scope-Zusammenfassung und Provenienz als Orientierung für neue Prompts und Entscheidungen.",
      en: "Use scope summaries and provenance as guidance for new prompts and decisions.",
    },
  },
] as const;

export const LANDING_BEGINNER_FLOW = {
  de: [
    "Modellzugang verbinden",
    "Erste Frage stellen",
    "Repo oder Datei als Kontext laden",
    "Output in Workbench weiterreichen",
    "Matrix-Scope prüfen und Topic-Plan freigeben",
  ],
  en: [
    "Connect model access",
    "Ask your first question",
    "Load repo or file context",
    "Review the output",
    "Save or dispatch the result",
  ],
} as const;

export const LANDING_POWER_RECIPES = [
  {
    title: {
      de: "Review Sprint",
      en: "Review Sprint",
    },
    text: {
      de: "Datei laden, Risiken prüfen, Kommentar vorbereiten.",
      en: "Load file, check risks, prepare comment.",
    },
  },
  {
    title: {
      de: "Knowledge Capture",
      en: "Knowledge Capture",
    },
    text: {
      de: "Antwort verdichten, als Matrix-Entwurf übergeben und im Scope verankern.",
      en: "Condense response, pass it as a Matrix draft, and anchor it in scope.",
    },
  },
  {
    title: {
      de: "Model Switch",
      en: "Model Switch",
    },
    text: {
      de: "Schnelles Modell für Reads, starkes Modell für Reviews.",
      en: "Fast model for reads, stronger model for reviews.",
    },
  },
  {
    title: {
      de: "Team Handoff",
      en: "Team Handoff",
    },
    text: {
      de: "Projektstand zusammenfassen, teilen, nächste Aktion ableiten.",
      en: "Summarize project status, share it, derive next action.",
    },
  },
] as const;
