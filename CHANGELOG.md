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
