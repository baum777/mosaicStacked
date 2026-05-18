# Wiki Index

Format: `[[link]] | summary | #tags | YYYY-MM-DD`

[[../README.md]] | Repo-Frontdoor mit aktuellem Console-Ist-Zustand, Authority-Diagrammen, Routen, Env-Flächen und Verifikation | #frontdoor #canonical #product | 2026-05-16
[[../AGENTS.md]] | Operating Contract, Authority Boundary und Hard Rules | #governance #authority #canonical | 2026-05-10
[[../WORKFLOW.md]] | Lineare Arbeitssequenz, Fail-Closed-Regeln und Logging-Route | #governance #workflow #canonical | 2026-05-10
[[../00-schema/AGENTS.md]] | Workflow-Spec, Wahrheitsebenen, Statussprache, Tags und Frontmatter-Contract | #governance #schema #canonical | 2026-05-10
[[../00-schema/mspr-spec.md]] | MSPR-Packet-Format, Trigger und Review-Logik | #governance #schema #mspr | 2026-05-10
[[../system/index.md]] | Durable System-Index und Referenzrouting | #system #governance #derived | 2026-05-10
[[../system/repo-map.md]] | Repo-Map mit Product-, Governance- und Derived-Flächen | #system #map #derived | 2026-05-10
[[../system/file-conventions.md]] | Ordnerrollen, Namensregeln und Dokumentationssplit | #system #conventions #derived | 2026-05-10
[[../system/working-rules.md]] | Dokumentationsregeln, Change-Regeln und Fail-Closed-Regel | #system #workflow #derived | 2026-05-10
[[../docs/test-matrix.md]] | Verifikationsmatrix und Statusmodell fuer Checks | #docs #verification #derived | 2026-05-10
[[../docs/vercel-deployment.md]] | Vercel-Deployment-Topologie und Ops-Referenz | #docs #deployment #derived | 2026-05-10
[[../03-mspr/packets/2026-05-10-governance-bootstrap.yml]] | Review-Packet fuer neu gebootstrappte Governance-Surfaces | #mspr #governance #proposed | 2026-05-10
[[../03-mspr/packets/2026-05-10-mobile-redesign-browser-suite.yml]] | Superseded Browser-Suite-Validierungsluecke nach Mobile Redesign | #mspr #verification #superseded | 2026-05-10
[[../03-mspr/packets/2026-05-11-vercel-external-deploy-blocked.yml]] | Blocked external Vercel deployment due tenant disclosure policy despite explicit user approval | #mspr #deployment #blocked | 2026-05-11
[[../03-mspr/packets/2026-05-11-live-smoke-github-openrouter-blocked.yml]] | Blocked live GitHub/OpenRouter smoke due missing GitHub admin key and OpenRouter upstream 401 | #mspr #smoke #blocked | 2026-05-11
[[../03-mspr/packets/2026-05-12-vercel-production-deploy-blocked.yml]] | Blocked Vercel production deployment due tenant disclosure policy after explicit approval | #mspr #deployment #blocked | 2026-05-12
[[../03-mspr/packets/2026-05-13-github-env-deploy-blocked.yml]] | Blocked GitHub Install and Authorize deploy repeat due missing app slug and invalid private-key env parse | #mspr #github #deployment #blocked | 2026-05-13
[[../03-mspr/packets/2026-05-16-local-auth-github-key-blocked.yml]] | Accepted local auth review after valid GitHub App PEM restored repo verification; Matrix SSO browser session connected | #mspr #github #matrix #accepted | 2026-05-16
[[../03-mspr/packets/2026-05-16-openrouter-default-key-repo-blocked.yml]] | Blocked request to commit a live OpenRouter default key into repo material; use env or secret store instead | #mspr #security #blocked | 2026-05-16
[[../03-mspr/packets/2026-05-17-github-production-env-config-blocked.yml]] | Accepted production GitHub backend readiness and per-user GitHub scope after Vercel env boundary fix | #mspr #github #deployment #accepted | 2026-05-18
[[../03-mspr/packets/2026-05-18-env-example-github-secret-blocked.yml]] | Accepted cleanup of secret-like GitHub values from `.env.example`; example env now uses placeholder-only integration values | #mspr #security #github #accepted | 2026-05-18
[[../docs/superpowers/plans/2026-05-10-settings-authority-control-center.md]] | Implementation plan for Settings authority control center redesign | #docs #plan #settings | 2026-05-10
[[../docs/superpowers/specs/2026-05-16-agentic-helpdesk-companion-design.md]] | Proposed Design für agentischen Helpdesk Companion mit UI-Hilfe, Allowlist-Intents und Guardrails | #docs #chat #ux #authority | 2026-05-16
[[../docs/superpowers/plans/2026-05-16-agentic-helpdesk-companion.md]] | Implementation plan for guarded agentic Helpdesk Companion UI-help slice | #docs #plan #chat #ux | 2026-05-16
[[../web/src/App.tsx]] | 4-Tab shell (`chat`, `workbench`, `matrix`, `settings`) with legacy mode normalization to `workbench` and first-run landing gate into `/console` | #workbench #navigation #authority #landing | 2026-05-11
[[../web/src/components/GitHubWorkspace.tsx]] | Summary-first Workbench review center with concrete Repo-Auswahl, explicit local/backend action effect semantics, and approval-gated GitHub execution | #workbench #review #authority | 2026-05-18
[[../tests/browser/mosaicstacked.spec.ts]] | Browser verification for keyboard-first shell navigation, truth-rail authority signals, guarded Companion UI-help smoke, GitHub repo switching/action gates, fail-closed Matrix composer posture, and backend-capability-gated workbench execution | #workbench #chat #matrix #verification | 2026-05-18
[[../web/src/components/FloatingCompanion.tsx]] | Permanenter Floating Helpdesk Companion mit echter backend-verdrahteter Chat-Interaktion, minimiertem Button, expandierbarem Panel und A11y-Keyboard-Gates | #chat #ux #authority | 2026-05-16
[[../web/src/lib/companion-intents.ts]] | Allowlist- und Blocklist-Contract für agentische Companion-UI-Hilfe mit Default-Deny-Validierung | #chat #ux #authority | 2026-05-16
[[../web/src/lib/companion-context.ts]] | Redigierter Browser-Kontext-Snapshot für Companion-Antworten ohne Secrets, Provider-Ziele oder vollständige Inhalte | #chat #ux #authority | 2026-05-16
[[../server/src/lib/default-free-model.ts]] | Backend-Resolver für Alias `default-free` mit Priorität user-credential -> env -> lokaler Dev-Fallback (fail-closed bei fehlendem Key/Modell) | #chat #routing #authority | 2026-05-16
[[../server/src/lib/matrix-env.ts]] | Matrix-Backend-Config mit expliziter SSO-Callback-URL und fail-closed Readiness-Prüfung | #matrix #authority #derived | 2026-05-16
[[../server/src/lib/env.ts]] | Env-Normalisierung mit Vercel-Runtime-Grenze: lokale `.env` wird auf Vercel nicht geladen | #env #deployment #authority | 2026-05-18
[[../server/src/routes/integration-auth.ts]] | Backend-owned GitHub-/Matrix-Auth-Start-, Callback- und Status-Routen mit getrennter GitHub-App-/OAuth-Readiness-Diagnose | #matrix #github #authority #derived | 2026-05-17
[[../.env]] | Lokale GitHub-Auth-Konfiguration mit korrekter Callback-URL und numerischer App-Installation-ID fuer den Login-Flow | #env #github #derived | 2026-05-16
[[../.env.example]] | Gekürzte Beispiel-Env mit Kernwerten und nur den wirklich genutzten Feature-Blöcken | #env #docs #derived | 2026-05-16
[[../.gitignore]] | Lokaler Secret-/Build-Ausschluss inklusive Vercel-Pull-Dateien `.env*.local` und privaten PEM-Dateien | #env #security #derived | 2026-05-18
[[../.vercelignore]] | Vercel-Deploy-Ausschluss für lokale `.env`-Dateien, PEM-Keys und lokale Artefakte | #env #security #deployment | 2026-05-18
[[../docs/model-routing.md]] | Routing-Contract inkl. `default-free` Alias, fail-closed Fehlercodes und serverseitiger Key/Model-Priorisierung | #docs #chat #authority | 2026-05-16
[[../web/src/lib/shell-freshness.ts]] | Ableitung von `backend-fresh`, `local-restored` und `stale` für die persistente Truth Rail | #shell #truth #authority | 2026-05-16
[[../web/src/lib/navigation-palette.ts]] | Typisierte Navigation-Palette-Einträge für Tabs und Session-Targets im Keyboard-Flow | #navigation #poweruser #contract | 2026-05-16
[[../web/src/lib/button-gate.ts]] | Einheitliches UI-Gate-Contract-Mapping von Block-Gründen auf `aria-disabled` und Tooltip-Copy | #ux #gating #authority | 2026-05-16
[[../vercel.json]] | Vercel-Rewrite-Contract für Backend-Routen, API-Adapter und SPA-Fallback | #deployment #routing #derived | 2026-05-17
[[../docs/ui-refactoring-plan-v2.md]] | Umsetzbarer UI-Refactorplan v2 mit Dual-Track-Constraints, Layer-/Token-Migration und Repo-konformen Gates | #docs #ui #plan #derived | 2026-05-18
[[../docs/ui-refactor-baseline-2026-05-18.md]] | Baseline-Snapshot für UI-Refactor mit CSS-Metriken, Konfliktindikatoren und Bundle-Gate-Nachweis | #docs #ui #metrics #derived | 2026-05-18
[[../web/src/styles/README.md]] | Token-/Layer-Leitfaden für die schrittweise CSS-Migration mit Legacy-Bridge und Dark-Only-Canonical | #ui #styles #derived | 2026-05-18
[[../web/src/styles.css]] | Konsolidierte Mobile-Surface-Styles ohne tote `context-browser`-Selektoren; Bottom-Nav, Settings-Rows und Bottom-Sheet-Primitives bleiben testgebunden stabil | #ui #styles #mobile #derived | 2026-05-18
[[../web/src/ui-adaptation.css]] | Deferred-Stability-Guard mit testverbindlichen `!important`-Locks für Brand-Mark, Context-Separator-Reset und Active-Tab-After-Reset | #ui #styles #mobile #derived | 2026-05-18
[[../web/src/components/SettingsWorkspace.tsx]] | Mobile Settings als Control Center mit kompakteren Listen-Rows und Detailfokus im Bottom-Sheet | #ui #settings #mobile #derived | 2026-05-18
[[../web/src/components/mobile/shared/SettingsRow.tsx]] | Mobile Settings-Row Primitive mit optionalem Detail-Track und Tone-Varianten | #ui #settings #mobile #derived | 2026-05-18
[[../docs/smoke-test-matrix.md]] | Holistische Smoke-Matrix mit lokaler Default-Orchestrierung (`smoke`) und klarer Abgrenzung zu opt-in Live-Smokes | #docs #smoke #verification #derived | 2026-05-18
