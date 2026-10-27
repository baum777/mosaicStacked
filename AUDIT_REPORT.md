# Repository Health Report

**Scope:** Deep-dive 360° audit (static analysis, live smoke tests, full verification run) + remediation sprint
**Date:** 2026-10-27
**Project:** mosaicStacked (monorepo: server + web workspaces, main @ a19c0cf + security sprint)
**Method:** Manual code review of server routes/auth/model-routing, frontend surface review, npm audit, live server smoke tests, full typecheck/test/build verification

---

## Gesamtstatus

**Status:** 🟢 **Grün** (P1-Sicherheitsfindings behoben, P2-Robustheit umgesetzt, Verifikation vollständig)

**Nach dem Remediation-Sprint:**
- Typecheck: server + web ✅
- Tests: 249 server / 358 web — alle grün ✅ (inkl. 12 neuer Security-Gate-Tests + 4 SW-Tests)
- Build: ✅
- `npm audit`: 0 Vulnerabilities ✅ (fastify 5.12.7, zod 4.6.7, qs 6.16.1 via Override)
- CI: `npm audit --audit-level=high`-Gate ergänzt

---

## Behobene Findings (P1 — Sicherheit)

### 🔴 K-1: Unauthentifizierte Matrix-Write-Kette — **BEHOBEN**
`/api/matrix/analyze` und `/api/matrix/actions/:planId/execute` akzeptierten ohne jedes Auth-Gate beliebige Requests (nur Rate-Limit auf execute). Neu:
- Gate via `MATRIX_AGENT_API_KEY` (Header `X-MosaicStacked-Admin-Key`, timing-sicherer Vergleich) **oder** abgeschlossene Matrix-Integration-Session.
- Ohne Authority: 401 `matrix_unauthorized`; falscher Key: 403.
- Zusätzlich Rate-Limit-Scope `matrix_analyze` (Standard 20/min).
- Tote Env-Gates sind jetzt runtime-authoritativ: `MATRIX_ALLOWED_ACTION_TYPES` wird auf analyze/execute gegen den Plan-Actiontyp geprüft; `MATRIX_FAIL_CLOSED` erzwingt die Fallback-Policy (`allow_fallback_on_execute`) auf dem Execute-Pfad mit Journal-Event `matrix_execute_blocked`.
- `assertExecuteFallbackBlocked` erhält echte Werte (`modelPolicy.fallbackUsed`, `globalPolicy.allow_fallback_on_execute`) statt hardcoded Konstanten.

### 🟠 H-1: GitHub-Read/Propose ohne Session (Instance-Fallback) — **BEHOBEN**
`/api/github/repos`, `/api/github/context`, tree, file, propose, plan-fetch und verify erfordern jetzt eine Integration-Session mit GitHub-Credential **oder** einen gültigen Agent-Admin-Key. Anonyme Requests erhalten 401 und rollen nie mehr auf Instanz-Credentials zurück. Execute prüft den Admin-Key **vor** dem Credential-Resolve.

### 🟠 H-2: `/api/github/capabilities` als Admin-Key-Orakel — **BEHOBEN**
Neuer Rate-Limit-Scope `github_capabilities` (Standard 60/min pro IP) drosselt Brute-Force-Versuche.

### 🟠 H-3: Integrations-Session-Fixation — **BEHOBEN**
`ensureSession` übernimmt client-gelieferte Session-IDs nur noch, wenn sie zuvor serverseitig ausgestellt wurden; gefälschte Cookie-Werte erzeugen eine neue Server-UUID. Sessions tragen eine Idle-TTL (`INTEGRATION_AUTH_SESSION_TTL_SECONDS`, Standard 7 Tage) und verlieren bei Ablauf Connections + verschlüsselte Credentials.

### 🟠 H-4: High-Dependency-Advisories — **BEHOBEN**
fastify 5.8.5 → 5.12.7 (Auth-Bypass-Advisory), zod 4.4.3 → 4.6.7 (Memory-Exhaustion), `qs` 6.14.2 → 6.16.1 (Override, dev-only über Cypress). `npm audit`: 0 Findings.

### 🟠 H-5: SW-Stale-Cache / Chunk-404-Falle — **BEHOBEN (P2)**
- Ungehashte Assets (index.html, Manifests, Icons, Fonts) werden network-first ausgeliefert; gehashte `/assets/` bleiben cache-first (immutable).
- Chunk-404s greifen auf den vorherigen Cache zurück; die Aktivierung behält die direkt vorherige Cache-Version für stale Tabs.
- Update-Flow: `controllerchange`-Reload (sessionStorage-guarded), Update-Checks alle 5 Minuten + bei Tab-Fokus. Cache-Version → `mosaicstacked-shell-v6`.

### 🟡 M-Findings — **TEILWEISE BEHOBEN (P2)**
- **Abort-Race im Chat-Stream:** Client-Disconnects werden über das verlässliche `close`-Event erkannt (guarded by `writableEnded`); der OpenRouter-Client bricht bei Caller-Abort sofort ab statt auf das nächste Provider-Target zu failovern — keine Phantom-Timeouts mehr.
- **Rate-Limit-Keys hinter Proxy:** `TRUST_PROXY` (default `false`) verdrahtet Fastify `trustProxy`; hinter Vercel/nginx keyen Buckets auf echte Client-IPs (ohne das Flag würde eine Serverless-Deployment einen einzigen globalen Bucket teilen).
- **Fehlende Security-Header:** `vercel.json` setzt CSP (`default-src 'self'`, kein `unsafe-inline` bei Scripts, `frame-ancestors 'none'`), `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Offen (dokumentiert):** Das Rate-Limit bleibt pro Instanz in-memory. Eine globale Serverless-Quota (z. B. Upstash Redis) erfordert eine Async-Umbau des Limiter-Interface — bewusst als P3-Backlog-Item mit Interface-Notes in `server/README.md` dokumentiert, statt eine Schein-Integration zu shippen.

---

## Weiterhin gültige Stärken

- XSS-Fläche bleibt null (kein `dangerouslySetInnerHTML`, Backend-owned Rendering)
- Fail-closed-Kultur durchgehend (ungkonfigurierte Integrations antworten mit 503, nicht mit Fehlerdetails)
- Secret-Hygiene: AES-256-GCM-verschlüsselte Credential-Envelopes, Log-Redaction, keine Secrets im Code
- 590+ Tests, CI mit Audit-Gate, Dependabot

---

## Offene Punkte (P3 — Backlog)

- [ ] Globales/distributed Rate-Limit für Serverless (Upstash Redis o. ä.) — benötigt Async-Refaktor des `AppRateLimiter`
- [ ] Atomarer Plan-Claim (execute-Race über zwei parallele Requests auf dasselbe Plan-Objekt)
- [ ] Cross-Tab-Storage-Konsolidierung
- [ ] Redaction-Tests weiter härten
- [ ] Safari-inkompatible Regex ersetzen (falls im Zielbrowser-Set relevant)
- [ ] Doku: Matrix-Integration-Security-Modul vollständig ausformulieren (Scope-Doku begonnen in `server/README.md`)

## Wartung (aus früherem Report, weiterhin offen)

- [ ] LICENSE-Datei ergänzen (öffentliches Repo)
- [ ] Experimentelle Branches mergen oder löschen
- [ ] Pre-Commit-Hook für Typecheck
- [ ] CONTRIBUTING.md ergänzen
