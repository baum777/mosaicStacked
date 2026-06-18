---
title: Swarm Task Routing
page_type: derived
status: proposed
authority: derived
owner: governance
updated: 2026-06-08
tags:
  - "#governance"
  - "#swarm"
  - "#routing"
  - "#proposed"
---

# Swarm Task Routing

Variable Routing-Logik: jede Task-Klasse wird an Orchestrator / Builder /
Reviewer verteilt, mit Autonomy Tier und Review-Pflicht.

## Routing-Tabelle

| Task-Klasse | Orchestrator | Builder | Reviewer | Tier | Review |
| --- | --- | --- | --- | --- | --- |
| `read_only_audit` | Scope klassifizieren | Dateien lesen, Findings schreiben | Memory prüfen | Tier 1 | Nein |
| `docs_spec` | Scope und Zielstruktur setzen | Spec schreiben | Konsistenz prüfen | Tier 2 | Optional |
| `implementation` | Slice begrenzen | Code + Tests | Diff / Test / Policy prüfen | Tier 3 | Ja |
| `bugfix` | Scope + Repro setzen | Fix + Test | Regression + Diff prüfen | Tier 3 | Ja |
| `refactor` | Scope + Risiko setzen | Minimaler Refactor-Slice | Diff + Test prüfen | Tier 3 | Ja |
| `test_validation` | Validierungsumfang setzen | Tests / Lint / Typecheck ausführen | Evidence prüfen | Tier 2 | Optional |
| `governance_change` | Policy-Trigger prüfen | Docs / Rules ändern | Streng prüfen | Tier 3 | Ja |
| `ci_build_change` | Risk-Gate setzen | Minimal ändern | Full Validation | Tier 3 | Ja |
| `infra_db_change` | Approval erkennen | Nur mit Freigabe ändern | Streng prüfen | Tier 0 / 3 | Ja |
| `security_sensitive` | Blockieren oder eskalieren | Spec / Patch entwerfen | Streng prüfen | Tier 0 / 3 | Human Approval |
| `destructive_operation` | Blockieren | Nicht ausführen | Eskalieren | Tier 0 | Human Approval |

## mosaicStack-spezifische Mappings

| Repo-Pfad / -Datei | Routing-Hinweis |
| --- | --- |
| `server/**` | `implementation` oder `bugfix` (Tier 3) — Backend-Authority |
| `web/src/**` (außer `lib/`) | `implementation` (Tier 3) — Browser-Authority |
| `web/src/lib/**` mit Server-Berührung | `implementation` (Tier 3) — Authority-Boundary prüfen |
| `api/**`, `cypress/**`, `playwright/**` | `implementation` oder `test_validation` (Tier 2–3) |
| `00-schema/**`, `02-wiki/**`, `03-mspr/**` | `governance_change` (Tier 3) |
| `vercel.json`, `.vercel/**` | `ci_build_change` (Tier 3) |
| `.env`, `.env.example`, `.env.*.local` | `governance_change` (Tier 3) — Secrets-Discipline |
| `audit/**` | `read_only_audit` (Tier 1) — Findings-only |
| `artifacts/**` | meist `read_only_audit` (Tier 1) |
| `docs/**` | `docs_spec` (Tier 2) |
| `WORKFLOW.md`, `AGENTS.md`, `00-schema/AGENTS.md` | `governance_change` (Tier 3) |

## Routing-Beispiel

User Request: *"Schreibe einen neuen Endpunkt in `server/src/routes/`
für `/api/matrix/review`."*

1. Orchestrator klassifiziert `implementation` (Tier 3) und stellt fest:
   `Matrix` ist externer Vertrag, `AGENTS.md` markiert
   Matrix-Schreib-Pfade als `contract-only` bis eine echte Origin
   end-to-end verifiziert ist.
2. Orchestrator eskaliert daher: kombinierte Klasse
   `governance_change` + `security_sensitive`, Tier 3 mit
   **explizitem Human Approval** (Matrix SSO und End-to-End-Origin
   fehlen in diesem Repo-Stand).
3. Builder entwirft den Endpunkt als **Spec / Stub**, nicht als
   lauffähige Schreib-Operation. Führt `tsc` und `vitest` aus.
   Schreibt Findings in `mspr_logbook.md`.
4. Reviewer prüft Drift, Side Effects, Browser-Bypass-Risiko, und
   lehnt produktive Implementierung ab, bis Origin verifiziert ist.
5. Bei `pass` der Spec: Übergang an nächsten Gate (Origin-Setup,
   Smoke, dann Re-Routing auf Tier 3).

## Routing-Override

Wenn ein Task eine Kombination aus Klassen hat (z. B. Implementation +
Governance-Change), gilt die **strengste** Klasse. Konflikte werden
in `mspr_logbook.md` als MSPR-Entry dokumentiert.
