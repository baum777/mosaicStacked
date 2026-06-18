# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows SemVer-compatible release notes.

## [Unreleased]

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

### Contract-Only (not yet runtime)
- Matrix Analyze, Review, Execute, Verify
- Matrix write / approval / provenance / hierarchy endpoints

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
