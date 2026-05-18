# Governance Log

## [2026-05-10] governance-bootstrap | created governance schema, workflow frontdoor, wiki index/log, and MSPR packet directory [[../WORKFLOW.md]] [[../00-schema/AGENTS.md]] [[../00-schema/mspr-spec.md]] [[index.md]] [[../03-mspr/packets/2026-05-10-governance-bootstrap.yml]]

## [2026-05-10] mobile-redesign-v1 | aligned mobile PWA tokens, local font aliases, BottomSheet interactions, haptics, GitHub activity rows, Matrix mobile disabled hint, and manifest posture [[../web/src/App.tsx]] [[../web/src/critical.css]] [[../web/src/components/mobile/shared/BottomSheet.tsx]] [[../web/test/mobile-redesign.test.ts]]

## [2026-05-10] mobile-redesign-browser-validation | routed failing browser-suite smoke as MSPR validation gap [[../03-mspr/packets/2026-05-10-mobile-redesign-browser-suite.yml]]

## [2026-05-10] browser-suite-repair | fixed public preview contract, console state loading, chat approval execution, focus outlines, and closed browser-suite validation gap [[../web/src/App.tsx]] [[../web/src/components/ChatWorkspace.tsx]] [[../03-mspr/packets/2026-05-10-mobile-redesign-browser-suite.yml]]

## [2026-05-10] github-oauth-production-fallback | added GitHub OAuth App start/callback support for production GITHUB_OAUTH_* configuration while preserving GitHub App installation flow [[../server/src/routes/integration-auth.ts]] [[../server/src/lib/integration-auth-config.ts]] [[../server/test/integration-auth-routes.test.ts]]

## [2026-05-10] mobile-ui-safe-restore | restored mobile/landing visual surfaces to last good checkpoint 08a88df while preserving OAuth backend fix and browser-suite approval/state-loading repairs [[../web/src/App.tsx]] [[../web/src/critical.css]] [[../web/src/styles.css]] [[../tests/browser/mosaicstacked.spec.ts]]

## [2026-05-10] mobile-css-load-stability | prevented deferred desktop CSS from repainting restored mobile shell chrome after idle timeout and loaded local font CSS immediately [[../web/src/main.tsx]] [[../web/src/ui-adaptation.css]] [[../web/test/mobile-redesign.test.ts]]

## [2026-05-10] desktop-css-responsive-stability | loaded viewport-gated desktop deferred CSS immediately, added critical/deferred desktop pane guards, and verified side panels plus main body stay within bounds [[../web/src/main.tsx]] [[../web/src/critical.css]] [[../web/src/ui-adaptation.css]] [[../tests/browser/mosaicstacked.spec.ts]]

## [2026-05-10] mobile-chat-three-zone-layout | reworked mobile chat into a scrollable conversation zone, compact input stack, and rotating local tip rail while preserving backend-owned chat and approval flow [[../web/src/components/ChatWorkspace.tsx]] [[../web/src/critical.css]] [[../web/src/ui-adaptation.css]] [[../tests/browser/mosaicstacked.spec.ts]]

## [2026-05-10] mobile-chat-composer-header-polish | integrated the mobile send CTA into the input field, hid the textarea scrollbar, aligned chat/input surfaces with a golden-ratio layout token, and added mobile theme plus en/de toggles to the header [[../web/src/components/mobile/chat/ComposeZone.tsx]] [[../web/src/components/mobile/layout/TopContextBar.tsx]] [[../web/src/App.tsx]] [[../web/src/critical.css]] [[../web/src/ui-adaptation.css]]

## [2026-05-10] mobile-header-desktop-toggle-parity | aligned the mobile header controls with desktop theme and language toggles by reusing theme-toggle-button, shell-language-toggle, shell-language-button, and the desktop ☀/☾ theme glyphs [[../web/src/components/mobile/layout/TopContextBar.tsx]] [[../web/src/App.tsx]] [[../web/src/critical.css]] [[../web/src/ui-adaptation.css]]

## [2026-05-10] settings-authority-control-center-plan | created implementation plan for the confirmed Settings authority control center concept [[../docs/superpowers/plans/2026-05-10-settings-authority-control-center.md]]

## [2026-05-10] settings-authority-control-center | reworked mobile Settings into a backend-authority control center with truth snapshot, grouped access/operation/expert rows, safe BottomSheet details, and browser coverage [[../web/src/components/SettingsWorkspace.tsx]] [[../web/src/components/mobile/shared/SettingsRow.tsx]] [[../tests/browser/mosaicstacked.spec.ts]]

## [2026-05-10] mobile-openrouter-settings-dropdown | added a mobile Settings OpenRouter dropdown for backend-owned API key and alias/model-id entry, preserving desktop form behavior and secret redaction [[../web/src/components/SettingsWorkspace.tsx]] [[../tests/browser/mosaicstacked.spec.ts]]

## [2026-05-10] mobile-openrouter-sheet-padding | tightened global mobile BottomSheet text padding and OpenRouter dropdown typography to prevent oversized overlapping copy while keeping 16px input text for mobile keyboards [[../web/src/components/SettingsWorkspace.tsx]] [[../web/src/critical.css]] [[../web/src/styles.css]] [[../web/src/ui-adaptation.css]]

## [2026-05-10] vercel-production-deploy | deployed main commit 31c473f to Vercel production dpl_C2ijFGzgD4FpfoBPowaHbn5mbXv4 and verified /health on https://mosaicstacked.vercel.app [[../docs/vercel-deployment.md]]

## [2026-05-10] openrouter-settings-submit-validation | aligned Settings OpenRouter form validation with backend credential contract, surfaced save/test errors inline, and removed misleading mobile alias-entry copy [[../web/src/components/SettingsWorkspace.tsx]] [[../web/src/lib/openrouter-inputs.ts]] [[../web/src/App.tsx]] [[../web/test/settings-workspace.test.ts]]

## [2026-05-10] openrouter-settings-production-deploy | deployed main commit 1073ed3 to Vercel production dpl_6ShjN52ry85fLw24vhR7VxfC1r6B and verified /health on https://mosaicstacked.vercel.app [[../web/src/components/SettingsWorkspace.tsx]] [[../web/src/lib/openrouter-inputs.ts]] [[../docs/vercel-deployment.md]]

## [2026-05-11] workbench-4-tab-authority-semantics | reduced shell navigation to four tabs, normalized legacy mode URLs to workbench, added Chat Read only/Read & Write guardrails, and converted GitHub workspace into summary-first authority-safe Workbench actions [[../web/src/App.tsx]] [[../web/src/components/ChatWorkspace.tsx]] [[../web/src/components/GitHubWorkspace.tsx]] [[../web/src/lib/localization.tsx]] [[../web/test/mobile-redesign.test.ts]] [[../web/test/app-localization.test.ts]] [[../web/test/github-workspace.test.ts]]

## [2026-05-11] workbench-chat-authority-browser-verification | aligned browser flows with 4-tab Workbench navigation, explicit RW branch-selector gating, local-only mark/remove semantics, and backend-capability-gated PR execution wording [[../web/src/components/GitHubWorkspace.tsx]] [[../web/src/components/ChatWorkspace.tsx]] [[../tests/browser/mosaicstacked.spec.ts]] [[../web/test/chat-workflow.test.ts]] [[../web/test/github-workspace.test.ts]]

## [2026-05-11] vercel-external-deploy-blocked | external deploy attempt remained blocked by tenant disclosure policy after explicit user approval; routed to MSPR for human policy review [[../03-mspr/packets/2026-05-11-vercel-external-deploy-blocked.yml]]

## [2026-05-11] live-smoke-github-openrouter-blocked | opened live app browser and routed blocked GitHub/OpenRouter smoke validation to MSPR due missing GitHub admin key and OpenRouter upstream 401 [[../03-mspr/packets/2026-05-11-live-smoke-github-openrouter-blocked.yml]]

## [2026-05-12] github-app-installation-repo-scope | changed GitHub repo authority from env allowlist-first to GitHub App installation repository selection for user-connected sessions, with optional instance-mode narrowing [[../server/src/routes/github.ts]] [[../server/src/routes/integration-auth.ts]] [[../server/src/lib/github-app-auth.ts]] [[../docs/routing-matrix.md]]

## [2026-05-12] vercel-production-deploy-blocked | production deploy was explicitly approved but blocked by tenant external-disclosure policy after typecheck and build passed [[../03-mspr/packets/2026-05-12-vercel-production-deploy-blocked.yml]]

## [2026-05-12] vercel-production-deploy-repeat-blocked | repeated explicit production deploy command was blocked again by tenant external-disclosure policy; existing MSPR evidence updated [[../03-mspr/packets/2026-05-12-vercel-production-deploy-blocked.yml]]

## [2026-05-12] github-app-install-authorize-callback | resolved GitHub App Install & Authorize OAuth code callbacks into backend-owned installation credentials and GitHub-selected repository scope [[../server/src/routes/integration-auth.ts]] [[../server/test/integration-auth-routes.test.ts]] [[../docs/routing-matrix.md]]

## [2026-05-13] github-env-deploy-repeat-blocked | loaded local dotenv metadata, generated missing local session/encryption secrets, and blocked deploy repeat because GitHub App slug is missing and private key is not parseable as PEM [[../03-mspr/packets/2026-05-13-github-env-deploy-blocked.yml]]

## [2026-05-13] vercel-deploy-repeat-blocked | repeated explicit vercel deploy request after local env updates remained blocked by tenant external-disclosure policy; updated existing MSPR deployment packet evidence [[../03-mspr/packets/2026-05-12-vercel-production-deploy-blocked.yml]]

## [2026-05-13] landingpage-istzustand-refresh | aligned landing copy with current backend-owned workbench flow, matrix scope/topic posture, and fail-closed matrix composer semantics [[../web/src/App.tsx]]

## [2026-05-13] favicon-transparent-latest-switch | switched web head favicon to bundled transparent `.ico` variant and aligned head contract test expectation [[../web/index.html]] [[../web/test/pwa.test.ts]]

## [2026-05-13] mobile-landing-overflow-guards | hardened mobile landing hero/action layout against horizontal overflow and long-copy wrap regressions, plus added css guard assertions [[../web/src/ui-adaptation.css]] [[../web/test/mobile-redesign.test.ts]]

## [2026-05-13] mobile-workspace-guide-overhaul | compressed chat functional copy, expanded cross-workspace mobile tip loop, upgraded guide overlay to fullscreen blurred swipe/wheel navigation, redesigned Workbench mobile flow cards, and added Matrix server-interaction action sheets [[../web/src/components/ChatWorkspace.tsx]] [[../web/src/components/GuideOverlay.tsx]] [[../web/src/components/GitHubWorkspace.tsx]] [[../web/src/components/MatrixWorkspace.tsx]] [[../web/src/critical.css]] [[../web/src/styles.css]] [[../web/src/ui-adaptation.css]] [[../web/test/chat-workflow.test.ts]] [[../web/test/mobile-redesign.test.ts]] [[../tests/browser/mosaicstacked.spec.ts]]

## [2026-05-14] geist-system-console-font-tokens | introduced global Geist-oriented font tokens and mapped legacy console sans/mono aliases to them across critical and deferred CSS surfaces [[../web/src/critical.css]] [[../web/src/styles.css]] [[../web/src/ui-adaptation.css]]

## [2026-05-15] local-env-vercel-callback-removal | replaced GitHub OAuth callback from vercel app URL to local backend callback and verified fresh full build success [[../.env]]

## [2026-05-15] github-oauth-token-exchange-detail-sanitization | exposed sanitized GitHub OAuth token exchange failure reasons in callback error details and covered redirect_uri_mismatch with route tests [[../server/src/routes/integration-auth.ts]] [[../server/test/integration-auth-routes.test.ts]]

## [2026-05-15] github-oauth-urlencoded-error-detail-sanitization | extended GitHub OAuth token exchange detail parsing to handle urlencoded upstream bodies and covered bad_verification_code mapping with auth route tests [[../server/src/routes/integration-auth.ts]] [[../server/test/integration-auth-routes.test.ts]]

## [2026-05-15] github-lib-compat-without-array-at | replaced Array.prototype.at usage in GitHub plan/context/execution helpers with index-safe lookups for older TypeScript lib targets [[../server/src/lib/github-plan-builder.ts]] [[../server/src/lib/github-context-builder.ts]] [[../server/src/lib/github-execution.ts]]

## [2026-05-15] floating-companion-helpdesk-entry | added a fixed bottom-right Floating Companion with hover/contact feedback, compact helpdesk panel, local placeholder submit flow, accessibility keyboard controls, and source-level tests for UI/state contracts [[../web/src/components/FloatingCompanion.tsx]] [[../web/src/App.tsx]] [[../web/src/critical.css]] [[../web/src/ui-adaptation.css]] [[../web/test/floating-companion.test.ts]] [[../package.json]]

## [2026-05-16] default-free-chat-companion-routing | introduced backend-owned `default-free` model alias/config, wired Chat workspace fallback order, connected Floating Companion to `/chat`, surfaced Settings status, expanded fail-closed error codes, and added regression tests plus env/docs updates [[../server/src/lib/default-free-model.ts]] [[../server/src/routes/chat.ts]] [[../server/src/routes/settings-openrouter.ts]] [[../server/src/lib/model-policy.ts]] [[../web/src/components/ChatWorkspace.tsx]] [[../web/src/components/FloatingCompanion.tsx]] [[../web/src/App.tsx]] [[../web/src/components/SettingsWorkspace.tsx]] [[../server/test/chat-router.test.ts]] [[../web/test/chat-workspace-persistence.test.ts]] [[../web/test/floating-companion.test.ts]] [[../.env.example]] [[../README.md]] [[../docs/model-routing.md]]

## [2026-05-16] ui-redesign-p0-p1-keyboard-truth-fail-closed | delivered P0+P1 shell redesign with global keyboard navigation (`Cmd/Ctrl+1..4`, `Cmd/Ctrl+K`, `Cmd/Ctrl+Shift+E`, `Escape`), persistent truth rail freshness/health/model signals, inline chat mode+branch+model controls, sequential workbench stepper gates, matrix preview-only composer actions (`Copy draft`, `Queue in Chat`), dark-only shell posture, runtime TTL/SWR updates, and updated browser assertions for the new fail-closed/mobile contracts [[../web/src/App.tsx]] [[../web/src/components/ChatWorkspace.tsx]] [[../web/src/components/GitHubWorkspace.tsx]] [[../web/src/components/MatrixWorkspace.tsx]] [[../web/src/components/SettingsWorkspace.tsx]] [[../web/src/components/FloatingCompanion.tsx]] [[../web/src/hooks/useRuntimeStatus.ts]] [[../web/src/hooks/useWorkspaceSessions.ts]] [[../web/src/lib/request-dedup-cache.ts]] [[../web/src/lib/cross-tab-commands.ts]] [[../web/src/hooks/useCrossTabCommands.ts]] [[../web/src/lib/shell-freshness.ts]] [[../web/src/lib/navigation-palette.ts]] [[../web/src/lib/button-gate.ts]] [[../web/src/styles.css]] [[../web/src/critical.css]] [[../tests/browser/mosaicstacked.spec.ts]] [[../web/test/github-workspace.test.ts]] [[../web/test/mobile-redesign.test.ts]] [[../web/test/floating-companion.test.ts]]

## [2026-05-16] local-auth-matrix-connected-github-key-blocked | corrected local auth env routing for current repo, verified Matrix browser-session connection after SSO, and blocked GitHub repo verification on non-PEM GitHub App private key [[../.env]] [[../03-mspr/packets/2026-05-16-local-auth-github-key-blocked.yml]]

## [2026-05-16] local-github-pem-repo-connection | installed valid GitHub App PEM key from local download into `.env`, restarted backend, and verified `/api/github/repos` returns `baum777/mosaicStacked` ready via instance config [[../.env]] [[../03-mspr/packets/2026-05-16-local-auth-github-key-blocked.yml]]

## [2026-05-16] agentic-helpdesk-companion-design | created proposed design for guarded agentic Helpdesk Companion with app manual behavior, UI-help intents, context redaction, and default-deny restrictions [[../docs/superpowers/specs/2026-05-16-agentic-helpdesk-companion-design.md]]

## [2026-05-16] agentic-helpdesk-companion-plan | created implementation plan for guarded Companion context, intent allowlist, UI suggestions, and shell intent execution [[../docs/superpowers/plans/2026-05-16-agentic-helpdesk-companion.md]]

## [2026-05-16] agentic-helpdesk-companion-v1 | implemented guarded Companion context snapshots, default-deny intent validation, suggested UI actions, visible blocked-action feedback, and shell-owned safe intent execution [[../web/src/components/FloatingCompanion.tsx]] [[../web/src/lib/companion-intents.ts]] [[../web/src/lib/companion-context.ts]] [[../web/src/App.tsx]] [[../web/test/floating-companion.test.ts]]

## [2026-05-16] agentic-helpdesk-companion-smoke | added Playwright smoke coverage for Companion UI-help suggestions, Workbench navigation, and blocked GitHub/Matrix execute routes [[../tests/browser/mosaicstacked.spec.ts]]

## [2026-05-16] readme-repo-istzustand-refresh | aktualisierte README-Frontdoor mit aktuellem Console-Ist-Zustand, Mermaid-Architektur-/Approval-/Deployment-Diagrammen, Backend-Routen, Env-Flächen und Grenzen [[../README.md]]

## [2026-05-16] openrouter-default-key-repo-blocked | blocked live OpenRouter key persistence into repo material and routed secret exposure risk to MSPR without storing the key [[../03-mspr/packets/2026-05-16-openrouter-default-key-repo-blocked.yml]]

## [2026-05-16] github-auth-callback-structured-log | added structured GitHub callback console.info with request-shape and config-flag logging plus server coverage [[../server/src/routes/integration-auth.ts]] [[../server/test/integration-auth-routes.test.ts]]

## [2026-05-16] github-oauth-scope-delimiter-fix | fixed GitHub OAuth authorize scope formatting to use GitHub's space-delimited syntax and made token scope parsing accept comma or space delimiters [[../server/src/routes/integration-auth.ts]] [[../server/test/integration-auth-routes.test.ts]]

## [2026-05-16] matrix-callback-url-config-hardening | replaced Matrix callback origin derivation from forwarded request headers with explicit backend callback URL configuration, updated env/docs, and added regression coverage [[../server/src/lib/matrix-env.ts]] [[../server/src/routes/integration-auth.ts]] [[../server/test/matrix-env.test.ts]] [[../server/test/integration-auth-routes.test.ts]] [[../server/test-support/helpers.ts]] [[../README.md]] [[../.env.example]] [[../docs/test-matrix.md]] [[../docs/integration-auth-rotation-live-smoke.md]]

## [2026-05-16] landing-first-run-console-gate | updated the landing page into an interface-first entry surface and added a one-time localStorage gate that accepts directly into `/console` on first use [[../web/src/App.tsx]] [[../web/src/ui-adaptation.css]] [[../web/test/mobile-redesign.test.ts]] [[../web/test/app-localization.test.ts]] [[../02-wiki/index.md]]

## [2026-05-16] github-auth-local-installation-id-fix | corrected the local GitHub App installation ID and callback authority so the backend now reports `appReady: true` and a valid instance configuration for the login flow [[../.env]] [[../server/src/routes/integration-auth.ts]] [[../server/src/lib/github-env.ts]] [[../server/src/routes/integrations.ts]]

## [2026-05-16] env-example-minimalization | reduced `.env.example` to the actually relevant core, feature, and optional Matrix/GitHub/OpenRouter blocks; removed legacy smoke and router noise [[../.env.example]]

## [2026-05-17] vercel-diagnostics-rewrite-fix | routed production `/diagnostics` and `/journal/recent` through the Vercel backend adapter and covered the rewrite contract with config tests [[../vercel.json]] [[../server/test/vercel-config.test.ts]]

## [2026-05-17] github-production-env-config-blocked | reproduced production GitHub repo endpoint failure and routed missing backend GitHub App runtime readiness to MSPR [[../03-mspr/packets/2026-05-17-github-production-env-config-blocked.yml]]

## [2026-05-17] github-existing-install-oauth-connect-fix | changed GitHub connect start to prefer OAuth authorize when available so existing App installations can return an auth code instead of stopping on GitHub's installation detail page [[../server/src/routes/integration-auth.ts]] [[../server/test/integration-auth-routes.test.ts]]

## [2026-05-17] github-auth-status-oauth-readiness-fix | separated GitHub App readiness from OAuth readiness in the auth status endpoint so production diagnostics expose missing OAuth client config instead of reporting `oauthReady: true` from App-only readiness [[../server/src/routes/integration-auth.ts]] [[../server/test/integration-auth-routes.test.ts]]

## [2026-05-18] env-example-github-secret-blocked | blocked commit/push promotion of secret-like GitHub values in `.env.example` and routed cleanup/rotation to MSPR [[../03-mspr/packets/2026-05-18-env-example-github-secret-blocked.yml]]

## [2026-05-18] github-oauth-app-token-callback-fix | allowed GitHub callbacks that return an OAuth App token while GitHub App config is enabled to store a user OAuth identity when installation listing is unavailable, and added signed non-secret connection metadata fallback for serverless status continuity [[../server/src/routes/integration-auth.ts]] [[../server/src/routes/integrations.ts]] [[../server/src/lib/integration-auth-cookies.ts]] [[../server/test/integration-auth-routes.test.ts]]

## [2026-05-18] settings-integrations-status-early-apply | decoupled Settings runtime status application so backend health, GitHub capabilities, and integrations status update the browser state before slower aggregate probes finish [[../web/src/hooks/useRuntimeStatus.ts]] [[../web/test/settings-workspace.test.ts]]

## [2026-05-18] env-example-secret-cleanup | restored `.env.example` to placeholder-only GitHub/OpenRouter/Matrix values and accepted the prior MSPR blocker as cleaned up [[../.env.example]] [[../03-mspr/packets/2026-05-18-env-example-github-secret-blocked.yml]]

## [2026-05-18] matrix-landing-room-default | added backend-supported `MATRIX_LANDING_ROOM_ID` config, surfaced it via integrations status labels, and auto-selected the joined landing room as default Matrix scope target when no room is selected yet [[../server/src/lib/matrix-env.ts]] [[../server/src/routes/integrations.ts]] [[../server/test/matrix-env.test.ts]] [[../web/src/lib/api.ts]] [[../web/src/App.tsx]] [[../web/src/components/MatrixWorkspace.tsx]] [[../.env.example]] [[../server/README.md]]

## [2026-05-18] github-workbench-repo-switch-actions | fixed Workbench repo switching visibility by showing concrete `owner/repo` labels in repo selection and selected-state surfaces, and added Browser coverage for repo switch reset plus Open Diff, Copy Summary, Mark, Remove, Prepare, Create, and Verify actions [[../web/src/components/GitHubWorkspace.tsx]] [[../tests/browser/mosaicstacked.spec.ts]]

## [2026-05-18] vercel-env-pull-local-files | pulled Vercel development, preview, and production env files into ignored `.env*.local` targets; observed expected GitHub/Auth keys are still empty after dotenv parsing and updated the existing production GitHub MSPR evidence [[../.gitignore]] [[../03-mspr/packets/2026-05-17-github-production-env-config-blocked.yml]]

## [2026-05-18] private-pem-gitignore | replaced non-matching `.pem` ignore entry with `*.pem` so local GitHub App private-key files remain untracked [[../.gitignore]]

## [2026-05-18] vercel-production-github-key-redeploy | uploaded operator-approved signable GitHub App private key to Vercel Production without printing the secret, redeployed production dpl_BqeJ1Rmh7uYSiwqJopbm8FZJ8YH5, and verified `/api/github/repos` returns 200 ready repo data [[../03-mspr/packets/2026-05-17-github-production-env-config-blocked.yml]]

## [2026-05-18] vercel-production-user-github-scope | entfernte `GITHUB_ALLOWED_REPOS` und `GITHUB_APP_INSTALLATION_ID` aus Vercel Production, verhinderte `.env`-Hydration im Vercel-Handler, ergänzte `.vercelignore`, redeployte production dpl_8t27QpgACvKbGj4qEMeK1byKAgVo und verifizierte GitHub ohne User-Session als fail-closed [[../server/src/lib/env.ts]] [[../server/test/vercel-handler.test.ts]] [[../.vercelignore]] [[../03-mspr/packets/2026-05-17-github-production-env-config-blocked.yml]]

## [2026-05-18] ui-refactor-v2-token-layer-bridge | started UI refactor v2 with token foundation (`core`/`semantic`/`workspaces`), deferred layer imports, workspace data-attribute scoping, focus token harmonization, contain-intrinsic-size split, and removal of global scrollbar hide selectors [[../web/src/deferred.css]] [[../web/src/styles/tokens/core.css]] [[../web/src/styles/tokens/semantic.css]] [[../web/src/styles/tokens/workspaces.css]] [[../web/src/App.tsx]] [[../web/src/styles.css]] [[../web/src/critical.css]] [[../web/src/ui-adaptation.css]] [[../docs/ui-refactoring-plan-v2.md]] [[../docs/ui-refactor-baseline-2026-05-18.md]]

## [2026-05-18] ui-refactor-v2-critical-token-dedup-slice | removed redundant root-level token redefinitions from critical entry CSS and kept bridge coverage through semantic token aliases (`bg-primary`, `bg-elevated`) without changing dual-track loading [[../web/src/critical.css]] [[../web/src/styles/tokens/semantic.css]]

## [2026-05-18] ui-refactor-v2-mobile-important-reduction-slice | reduced `!important` usage for deferred mobile chrome guards (topbar, context strip, bottom nav, workspace tab mobile) while preserving selector scope and dual-track load behavior [[../web/src/ui-adaptation.css]]

## [2026-05-18] ui-refactor-v2-mobile-controls-important-reduction-slice | reduced additional `!important` usage for deferred mobile control chrome (topbar actions, model badge, language toggle/buttons, context path/chip action) while keeping guarded context-live and brand-button hard locks [[../web/src/ui-adaptation.css]]

## [2026-05-18] ui-refactor-v2-mobile-brand-context-important-reduction-slice | reduced further `!important` usage for deferred mobile brand/context guard (brand-button layout/text, context-live layout/text, governed chat ratio/container width), while preserving explicitly guarded background locks for stability [[../web/src/ui-adaptation.css]]

## [2026-05-18] ui-refactor-v2-mobile-composer-important-reduction-slice | reduced deferred mobile composer `!important` usage (composer container, compose field, textarea, submit button) while preserving existing values and behavior in the guarded mobile chat path [[../web/src/ui-adaptation.css]]

## [2026-05-18] ui-refactor-v2-mobile-pseudo-reset-important-reduction-slice | removed low-risk deferred mobile guard `!important` markers from pseudo-element resets and brand mark display, preserving mobile chrome behavior and selector scope [[../web/src/ui-adaptation.css]]

## [2026-05-18] ui-cleanup-onerun-context-browser-removal | removed dead mobile `ContextBrowserPanel` surface and related CSS selectors, restored test-bound deferred mobile stability guard `!important` markers, and tightened Settings mobile list density by suppressing verbose row details in-list while keeping sheet details [[../web/src/components/mobile/context/ContextBrowserPanel.tsx]] [[../web/src/styles.css]] [[../web/src/ui-adaptation.css]] [[../web/src/components/SettingsWorkspace.tsx]] [[../web/src/components/mobile/shared/SettingsRow.tsx]] [[../web/src/App.tsx]]

## [2026-05-18] smoke-suite-orchestrator-and-matrix | added root smoke orchestrator scripts (`smoke`, `smoke:local`, `smoke:ci`) and documented a codebase-derived holistic smoke matrix with explicit local-vs-live scope boundaries [[../package.json]] [[../docs/smoke-test-matrix.md]]

## [2026-05-18] openrouter-key-input-hardening | added OpenRouter API-key visibility toggle, hardened the key input against password-manager autofill collisions, and covered the behavior with Settings workspace regression assertions [[../web/src/components/SettingsWorkspace.tsx]] [[../web/src/styles.css]] [[../web/test/settings-workspace.test.ts]]
