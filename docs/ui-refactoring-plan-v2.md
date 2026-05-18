# MosaicStacked UI-Refactoringplan v2 (Repo-fit)

Stand: 2026-05-18  
Status: in Umsetzung (Dual-Track)

## Zielbild

- Dual-Track bleibt verbindlich: `web/src/critical.css` bleibt synchron, `web/src/deferred.css` bleibt nachgeladen.
- Dark-Only ist kanonisch für Runtime-Tokens.
- Token-Drift, Spezifitätskonflikte und globale Overrides werden schrittweise reduziert, ohne Performance-Gates zu brechen.

## Nicht verhandelbare Constraints

1. Kein Bruch im Startpfad (`main.tsx` + `critical.css` + `deferred.css`).
2. Keine globalen Scrollbar-Hides per `*`.
3. Fokusdarstellung nur über zentrale `:focus-visible` Token-Variablen.
4. Neue Token-Namen werden eingeführt, Legacy-Namen bleiben zunächst als Bridge aktiv.
5. Gates pro Phase:
   - `npm run typecheck`
   - `npm run test:web`
   - `npm run test:browser`
   - `npm run perf:bundle:web`
6. Optional je Milestone: `npm run perf:lighthouse:tti`.

## Phasen

### Phase A — Guardrails & Inventur (P0)

- Baseline-Snapshot erfassen (Zeilen, `:root`, `!important`, Bundle).
- Konfliktmatrix auf Token-Ebene dokumentieren.
- Constraints als verbindliche Regeln festhalten.

### Phase B — Token-Fundament (P0)

- Neue Token-Surfaces:
  - `web/src/styles/tokens/core.css`
  - `web/src/styles/tokens/semantic.css`
  - `web/src/styles/tokens/workspaces.css`
- Legacy-Bridge aktivieren (`--ms-*`, `--accent*`, `--bg*`, `--tx*`, `--bd*` etc.).

### Phase C — Layerisierung ohne Startpfad-Bruch (P0/P1)

- `web/src/deferred.css` auf Layer-Imports umstellen:
  - legacy Komponenten-/Override-Layer
  - Token-Layer (`core`, `semantic`, `workspaces`)
- `critical.css` nur um minimale Token-Imports erweitern, kein Desktop-Umzug.

### Phase D — Workspace-Scoping & Konfliktabbau (P1)

- `data-workspace` am Shell-Container als Scoping-Quelle.
- Workspace-Akzentlogik über `workspaces.css`.
- Konfliktstellen zentralisieren:
  - `contain-intrinsic-size` von statisch `1px 96px` auf komponentenspezifische `auto <höhe>`
  - globale Scrollbar-Regeln auf Utility/Komponenten-Scopes
  - Fokusregeln auf `--focus-*` Token

### Phase E — Cleanup (P2)

- Nach Stabilisierung Legacy-Aliasse schrittweise entfernen.
- Styleguide/Regeln finalisieren.
- Nur mit grünem Test-/Perf-Gate promoten.

## Abnahmekriterien

- Bundle-Gate bleibt grün.
- Keine globalen Scrollbar-Hides per `*`.
- Workspace-Wechsel ohne Farbsprung/Flash.
- Fokusdarstellung konsistent über `:focus-visible`.
- Kein Regressionseintrag im Browser-Suite-Gate.
