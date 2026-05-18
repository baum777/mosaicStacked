# UI Refactor Baseline — 2026-05-18

Quelle: lokaler Stand in `main_projects/mosaicStack`, vor weiterem Cleanup.

## Metriken

- CSS-Zeilen (`styles.css`, `critical.css`, `ui-adaptation.css`, `deferred.css`):
  - `15447` Gesamtzeilen
- `:root`-Treffer in den drei Hauptstylesheets:
  - `37`
- `!important`-Treffer in den drei Hauptstylesheets:
  - `229`
- Eindeutige CSS-Variablen:
  - `213`

## Top Konfliktkandidaten (häufig redefiniert)

- `--accent` (`11`)
- `--accent-strong` (`11`)
- `--success` (`9`)
- `--danger` (`9`)
- `--blue` (`9`)
- `--red` (`8`)
- `--bg` (`8`)

## Bundle-Gate (nach Layer-/Token-Startmigration)

Command: `npm run perf:bundle:web`  
Result: `PASS`

- Combined Gzip: `129.42 KiB` (Budget `180 KiB`)
- Combined Brotli: `110.12 KiB` (Budget `160 KiB`)

## Beobachtungen

- Dual-Track-Ladepfad bleibt aktiv (`critical.css` synchron, `deferred.css` nachgeladen).
- Globale Scrollbar-Hides per `*` wurden entfernt.
- Fokusdarstellung auf tokenisierte `:focus-visible`-Variablen umgestellt (Bridge-Phase).
