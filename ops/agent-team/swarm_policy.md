---
title: Swarm Policy
page_type: derived
status: proposed
authority: derived
owner: governance
updated: 2026-06-08
tags:
  - "#governance"
  - "#swarm"
  - "#policy"
  - "#proposed"
---

# Swarm Policy

Diese Policy ist **additiv** zur repo-lokalen Authority (`AGENTS.md`,
`WORKFLOW.md`, `00-schema/`). Bei Konflikt gewinnt die kanonische Quelle.
Diese Datei operationalisiert die Agent-Disziplin, ändert aber keine
Produkt- oder Runtime-Authority.

## Tier-Modell

| Tier | Name | Agent-Verhalten |
| --- | --- | --- |
| 0 | Blocked | Keine Aktion. Human Approval erforderlich. |
| 1 | Read-only | Nur Lesen und Findings. Keine Schreibvorgänge. |
| 2 | Draft / Spec | Drafts, Specs, Findings. Keine produktiven Writes. |
| 3 | Execute + Review | Implementiert, benötigt Reviewer-Pass. |
| 4 | Autonomous | Autonom mit harten Limits, Audit-Trail verpflichtend. |

## Immer blockieren oder eskalieren (Tier 0)

- `.env` lesen oder ändern
- Secrets ausgeben oder posten
- Produktions-Konfiguration ändern
- Daten löschen oder droppen
- Destruktive Git-Operationen (`force push`, `reset --hard`, rebase
  mit History-Rewrite, `rm -rf` in Repo-Scope)
- Migrationen ohne expliziten Auftrag
- Deployment ohne expliziten Auftrag
- Zugriff auf private Credentials

## Immer review-pflichtig (Tier 3 + Reviewer)

- Runtime-Core
- Agent-Core / Governance
- CI / Build / Package Manager
- Datenbank / Migration
- Auth / Permissions
- Externe API-Integrationen (z. B. Matrix, GitHub, OpenRouter)
- Cross-Package-Refactors
- Schema- oder Contract-Drift
- Änderungen an `vercel.json`, `.vercel/**`, `fly.toml`, `railway.toml`
- Browser-Write-Pfade, die Backend-Approval-Gating umgehen könnten

## Meist ohne Review möglich (Tier 1–2)

- Read-only Analyse
- Lokale Dokumentationsentwürfe
- Nicht-invasive Specs
- Reine Findings / Progress Updates
- Reine Memory-Extrakte in `agent_memory.md`
- Reine Wiki- oder Logbuch-Appends
- Reine Appends an `02-wiki/log.md`

## Bezug zu mosaicStack-spezifischen Regeln

- **Backend-owned Authority** (gemäß `AGENTS.md`): Tier 3 + Reviewer
  für alle Änderungen an `server/`, `api/`, `web/src/lib/` soweit
  sie Server-Authority berühren.
- **Browser-owned Surfaces**: Tier 2–3, je nach Eingriffstiefe.
- **Matrix als externer Vertrag**: Tier 0 für alle echten Matrix
  Schreib- oder Approval-Pfade, bis eine echte Matrix-Origin
  end-to-end verifiziert ist.
- **Vercel-Deploy**: Tier 3, da produktionsrelevant.
- **Live-Smoke gegen OpenRouter/GitHub**: Tier 0, da Secrets-
  Disziplin gemäß mehrerer MSPR-Packets strikt beachtet werden muss.

## Memory- und Logbuch-Regeln

- Memory darf Scope oder Policy **nicht** überschreiben.
- Keine Secrets in Memory. Niemals.
- Keine privaten Daten in Memory.
- Keine ungeprüften Vermutungen als Fakt speichern.
- Immer Quelle / Kontext angeben.
- Langlebige Erkenntnisse nur, wenn sie für künftige Runs tatsächlich
  relevant sind.

## Verstoß-Verhalten

Verstöße gegen Tier 0 werden sofort gestoppt und als MSPR-Packet
unter `03-mspr/packets/` mit `status: blocked` geloggt. Tier 3
Verstöße führen zu `needs_rework` mit konkreter Scope- oder
Policy-Korrektur. Schema aus `00-schema/mspr-spec.md` ist verbindlich.
