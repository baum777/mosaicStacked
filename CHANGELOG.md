# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows SemVer-compatible release notes.

## [Unreleased]

### Security (P1 sprint — hardening)
- Matrix write chain gated: `/api/matrix/analyze` and `/api/matrix/actions/:planId/execute` now require `MATRIX_AGENT_API_KEY` (header `X-MosaicStacked-Admin-Key`, timing-safe compare) or a completed Matrix integration session; anonymous requests answer 401. Matrix `analyze` is additionally rate limited (`RATE_LIMIT_MATRIX_ANALYZE_MAX`, default 20/min).
- Deferred Matrix env gates are now runtime-authoritative: `MATRIX_ALLOWED_ACTION_TYPES` validates plan action types on analyze and execute; `MATRIX_FAIL_CLOSED` enforces the model-routing fallback policy on execute (blocked with `matrix_forbidden` + journal event `matrix_execute_blocked` when the analyze model resolved via fallback). `assertExecuteFallbackBlocked` is fed real policy values (`fallbackUsed`, `allow_fallback_on_execute`) instead of hardcoded constants.
- GitHub read/propose bound to authority: `/api/github/repos`, `/api/github/context`, tree, file, `/api/github/actions/propose`, plan fetch and verify require an integration session with a connected GitHub credential or a valid agent admin key; anonymous requests no longer fall back to instance installation credentials (401). GitHub execute checks the admin key before resolving credentials.
- Rate limits extended: new scopes `github_read` (`RATE_LIMIT_GITHUB_READ_MAX`, default 60/min) for context/tree/file and `github_capabilities` (`RATE_LIMIT_GITHUB_CAPABILITIES_MAX`, default 60/min) throttling the admin-key oracle on `/api/github/capabilities`.
- Integration sessions hardened: session ids are only accepted when previously issued by the store (fixes session fixation via forged cookie values); sessions now carry an idle TTL (`INTEGRATION_AUTH_SESSION_TTL_SECONDS`, default 7 days) and expired sessions lose their connections and encrypted credentials.
- Dependency audit clean: `npm audit fix` bumps fastify 5.12.7 (auth bypass advisory) and zod 4.6.7 (memory exhaustion); `qs` overridden to 6.16.1 (dev-only cypress path); CI gained an `npm audit --audit-level=high` gate.

### Robustness (P2)
- Chat stream abort race fixed: client disconnects are detected via the reliable `close` event (guarded by `writableEnded`) instead of the deprecated `aborted` event, and the OpenRouter client stops provider failover immediately when the caller signal is aborted — no more phantom timeouts/error events after a client goes away.
- `TRUST_PROXY` env (default `false`) wires Fastify `trustProxy`: behind Vercel/nginx rate limit buckets key on real client IPs instead of the proxy address (without it, a serverless deployment would share one global bucket across all clients).
- Service worker update flow: `controllerchange` reloads once (sessionStorage-guarded against loops), update checks run every 5 minutes and on tab focus, unhashed assets are served network-first (hashed `/assets/` stay cache-first), chunk 404s fall back to the previous cache, and activation retains the directly previous cache version for stale tabs. CACHE_NAME bumped to `mosaicstacked-shell-v6`.
- Security headers via `vercel.json`: CSP (`default-src 'self'`, no `unsafe-inline` scripts, `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy` for camera/microphone/geolocation.

### Added
- Mobile shell: 5-column bottom navigation grid, settings gear button, context ellipsis menu, and approval-pending badge.
- `useConsoleTheme` hook with `DesktopSidebarTabs` (240 px sidebar) and dynamic `theme-color` updates across all console themes.
- Mobile workbench: chat composer auto-resize (96 → 200 px), 4-dot stage progress with Step 4 approval, 4-stage Matrix cards with `aria-live` submit hint, and a 3-tab DiffSheet backed by the widened `SegmentedControl<TValue>` component.
- Performance: lazy Settings workspace, tightened `manualChunks` (R9), deferred modulepreload whitelist (R15), and a `perf-cache.json` snapshot with `lastUpdated` (R7).
- Authority & polish: `VITE_MATRIX_HIERARCHY` flag plumbed into Settings diagnostics, extracted `adapter` / `openRouter` copy into `localization.tsx`, removed no-op `vendor-syntax` / `vendor-ui` preload prefixes, and a new `Performance Cache` section in `docs/PERFORMANCE.md`.
- Block F — Performance & bundle: MarkdownMessage/GuideOverlay/LandingPage lazy-loaded out of workspace chunks and shell; useRuntimeStatus split into useSettingsWorkspaceStatus with shared lib/settings-types; useVirtualScroll applied to SessionList (>20) and Matrix joinedRooms (>30); 5 row arrays wrapped in useMemo and 4 useMemo calls coalesced into currentSurfaceState; LandingPage extracted to web/src/landing/. 34 new tests; index-…js shrunk 188.64 kB → 177.42 kB.
- Block G — Test hard-rules + ErrorBoundary: 7 matrix-api validators (joined rooms, space hierarchy, scope summary, plan, room topic plan/execution/verification) tested; companion-context redaction property-tested; chat-workflow cancel + recovery + notice ring + reducer action matrix tested; workspace-state edge cases (forward-migration, unknown ids, race-flush) tested; matrix-gates table-driven; shell-freshness truth-table tested; new ErrorBoundary class component + shell-telemetry sink + 3 Suspense-level wraps in App.tsx. 40 new tests.

### Changed

### Verified
- `GET /health`, `GET /models`, `POST /chat`
- SSE lifecycle `start -> token* -> done|error`
- Matrix read-only `/api/matrix/*` routes
- Matrix malformed-200 fail-closed behavior
- Matrix analyze → execute → verify write chain with admin-key/session gate, action-type allowlist, and fallback-policy enforcement
- GitHub session/admin-key gates on read, propose, and execute surfaces; capability throttling
- Integration session fixation rejection, TTL expiry, and sliding-window renewal
- SW update flow (controllerchange reload guard, network-first unhashed assets, previous-cache fallback)

### Runtime Since Security Sprint
- Matrix Analyze, Review (approval), Execute, Verify — runtime behind the admin-key/session gate
- Matrix write / approval / provenance endpoints — runtime with evidence writes

### Contract-Only (not yet runtime)
- Matrix hierarchy endpoints (space hierarchy snapshots remain flag-gated contract surfaces)

### Deferred
- Live Matrix E2E verification against a real Matrix origin
- Undo
- Cross-device sync
- Bulk review queue
- Advanced observability

### Notes
- Vercel deployment posture keeps the dedicated Matrix adapter split (`api/[...path].ts` and `api/matrix/[...path].ts`) until explicit equivalence tests permit consolidation.
- Block G follow-up: redaction was moved into `createPinnedChatContext` so the stored `PinnedChatContext` object is safe to serialize (no BANNED_PROMPT_SENTINELS in any string field); covered by `createPinnedChatContext redacts BANNED_PROMPT_SENTINELS from the stored object itself` in `web/test/pinned-chat-context-redaction.test.ts`.
- Block G follow-up: shell-freshness case 3 already returned `local-restored` per spec; tests cover the full truth table — see `web/test/shell-freshness.test.ts`.
- Block G follow-up: dead `validateExecutionResponse` was already removed in `3ca342f`; the live Matrix execution validator is `validateRoomTopicExecutionResponse` wired to `executeRoomTopicUpdate` in `web/src/lib/matrix-api.ts:1034`.
