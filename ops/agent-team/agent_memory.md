---
title: Agent Memory
page_type: derived
status: proposed
authority: derived
owner: governance
updated: 2026-06-08
tags:
  - "#governance"
  - "#swarm"
  - "#memory"
  - "#proposed"
---

# Agent Memory

Drei Memory-Ebenen, wie im OrchestrAI_Labs-Prinzip vorgesehen. Diese
Datei ist **additives Governance-Memory** und ersetzt weder
`02-wiki/index.md` noch `03-mspr/packets/`.

## Working Memory

Kurzlebig. Nur aktueller Task. Wird in `mspr_logbook.md` als Progress-
Sektion pro Entry geführt. Wird mit Abschluss des Tasks verworfen.

> **Beispiel** (nicht eintragspflichtig):
>
> - User Request: <request>
> - Aktive Pfade: <paths>
> - Aktive Findings: <findings>
> - Verworfen bei Task-Ende.

## Repo Memory

Dauerhaft. Wird in Markdown-Artefakten unter `ops/agent-team/` (und
in `02-wiki/index.md` für dauerhafte Verweise) gespeichert. Nur
langlebige Erkenntnisse aufnehmen.

Aktuell Repo-Memory-Items:

| Datum | Item | Quelle | Status |
| --- | --- | --- | --- |
| 2026-06-08 | mosaicStack ist Backend-first Console-Overlay (Vite/React Web, Node/Express Server, optionale API/Playwright/Cypress). Standard-Validierungen sind `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff`/`status`. | `package.json` + `AGENTS.md` | active |
| 2026-06-08 | Matrix ist externer Vertrag, kein implementierter Write-Origin. Schreib- und Approval-Pfade bleiben Tier 0 bis End-to-End-Verifikation. | `AGENTS.md` Current Integration Ledger | active |
| 2026-06-08 | Live-Smokes gegen OpenRouter/GitHub sind blockiert durch fehlende Origin und Secrets-Discipline. Mehrere MSPR-Packets in `03-mspr/packets/` belegen das. | `03-mspr/packets/` | active |
| 2026-06-08 | Vercel-Deploy via `vercel.json` ist produktionsrelevant; jede Änderung Tier 3. | `vercel.json` | active |

## Semantic Memory

Optional. Wird nur aktiviert, wenn das Repo eine Embedding-, Vector-DB-
oder Retrieval-Infrastruktur aufbaut. Im aktuellen Zustand nicht
vorhanden; kein Aufbau geplant.

**Nicht implementieren, solange keine bestehende Retrieval- oder
Vector-Infrastruktur existiert.**

## Memory-Regeln (verbindlich)

- Nur langlebige Erkenntnisse speichern.
- Keine Secrets. Niemals.
- Keine privaten Daten.
- Keine ungeprüften Vermutungen als Fakt speichern.
- Immer Quelle / Kontext angeben.
- Memory darf Scope oder Policy nicht überschreiben.
- Bei Konflikt zwischen Memory und `AGENTS.md` / `00-schema/` /
  `WORKFLOW.md` gilt die kanonische Quelle.

## Promotion-Regel

Items in der Repo-Memory-Tabelle sind mit `proposed` markiert, bis sie
mindestens einmal in einem realen Workstream verwendet und vom
Reviewer bestätigt wurden. Danach Status `active`. Veraltete Items
werden mit `stale` markiert und nach einer Retension-Periode entfernt.

## Role-Typed Memory (Extended Roles v1)

Bei Aktivierung einer Spezialrolle aus dem Shared-Core (siehe
`swarm_roles.md` Erweiterung v1) werden langlebige Erkenntnisse nach
Rollen-Typ getrennt erfasst. Jede Zeile trägt ein `role`-Tag.

| Datum | role | Item | Quelle | Status |
| --- | --- | --- | --- | --- |
| 2026-06-08 | (alle) | Shared-Core Rollenbibliothek ist `proposed`; Adoption hier ist opt-in und additiv. | `model-agnostic-workflow-system/docs/agent-teams/README.md` | active |
| 2026-06-08 | `architecture-planner` | Backend (`server/`) ist Express/Fastify-API; Frontend (`web/`) ist Vite/React. Architektur-Plan muss Backend-/Browser-Authority trennen. | `package.json` | active |
| 2026-06-08 | `governance-policy-agent` | Matrix-Schreib-Pfade bleiben Tier 0 bis Origin end-to-end verifiziert. | `AGENTS.md` Current Integration Ledger | active |
| 2026-06-08 | `test-validation-agent` | Standard-Validierungen: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff`. | `package.json` scripts | active |
| 2026-06-08 | `integration-agent` | GitHub OAuth, OpenRouter, Matrix sind externe Vertrags-Surfaces; Auth-Drift ist Live-Smoke-Risiko. | `03-mspr/packets/2026-05-11-live-smoke-github-openrouter-blocked.yml` | active |
| 2026-06-08 | `security-abuse-case-agent` | Secrets-Discipline: keine Live-Keys in `.env.example`; nur Placeholder. | `03-mspr/packets/2026-05-18-env-example-github-secret-blocked.yml` | active |
| 2026-06-08 | `release-captain` | Vercel-Deploy via `vercel.json` ist produktionsrelevant; jeder Release-Slice benötigt Rollback-Plan. | `vercel.json` | active |

**Role-Index:** siehe Shared-Core-Spec
`swarm_roles_extended_spec.md` für die vollständige Liste und
Aktivierungs-Modi (`modelagnostic-autonomous`,
`explicit-user-call-required`, `approval-required`).
