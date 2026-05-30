# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows SemVer-compatible release notes.

## [Unreleased]

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
