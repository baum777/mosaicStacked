# MosaicStacked Smoke-Test-Matrix

## Ziel
Lokale, reproduzierbare Smoke-Schicht ohne Pflicht auf Live-Secrets oder externe Provider.

## Scope
- Pflicht-Gates: `typecheck`, `build`, `test`, `test:browser`
- Opt-in-Live-Smokes: GitHub/Matrix/OAuth nur bei expliziter Env-Konfiguration

## Smoke-Matrix

| Surface | Existing Coverage | Gap | Proposed Smoke |
| --- | --- | --- | --- |
| App Shell | `tests/browser/mosaicstacked.spec.ts` (`root route renders public preview...`, `shell renders core governed surfaces...`) | Kein Root-Orchestrator | `npm run smoke:local` / `npm run smoke:ci` |
| Console | `tests/browser/mosaicstacked.spec.ts` (`console route normalizes...`, Tab-/Layout-Checks) | Kein dedizierter Smoke-Einstieg | `npm run smoke` |
| Settings/Auth CTA | `tests/browser/mosaicstacked.spec.ts` (`Settings ... opens detail sheet`, GitHub/Matrix CTA), `web/test/settings-workspace.test.ts` | Keine | Über `npm run test` + `npm run test:browser` |
| GitHub | `tests/browser/mosaicstacked.spec.ts` (analysis/proposal/execute/verify + stale/fail-closed), `server/test/github-*.test.ts` | Live-Smoke nicht default-fähig | `smoke:github` bleibt opt-in |
| Matrix | `tests/browser/mosaicstacked.spec.ts` (fail-closed + topic flow), `server/test/matrix-*.test.ts` | Live-Token abhängig | `smoke:matrix` bleibt opt-in |
| Diagnostics | `web/test/diagnostics-api.test.ts`, `server/test/backend.test.ts` (`/diagnostics`, `/journal/recent`) | Keine | In `npm run test` enthalten |
| Chat | `web/test/chat-workflow.test.ts`, `server/test/chat-router.test.ts`, `server/test/backend.test.ts` | Keine | In `npm run test` enthalten |
| Mobile/PWA | `web/test/mobile-redesign.test.ts`, `web/test/pwa.test.ts`, Browser-Mobile-Viewport-Checks | Keine | In `npm run test` + `npm run test:browser` enthalten |
| Server fail-closed | `server/test/backend.test.ts`, `server/test/github-routes.test.ts`, `server/test/matrix-client.test.ts`, `server/test/openrouter*.test.ts` | Keine | In `npm run test:server` enthalten |

## Kommandos

- Lokal (ohne Build-Zwang):
  - `npm run smoke:local`
- CI-orientiert:
  - `npm run smoke:ci`
- Standard:
  - `npm run smoke` (alias auf `smoke:ci`)

## Live-/Extern-Abhängigkeiten

- Nicht im Default-Smoke enthalten:
  - `npm run smoke:github`
  - `npm run smoke:matrix`
  - `npm run smoke:matrix-evidence`
  - `npm run test:matrix-live`
  - `npm run test:matrix-evidence-live`
  - `npm run test:integration-auth-rotation-live*`

Diese bleiben opt-in und env-gesteuert.
